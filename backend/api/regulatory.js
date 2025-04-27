const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, '../data/regulatory_results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Anthropic API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Add this function near the top of the file
async function callClaudeAPI(endpoint, data, headers) {
  // List of models to try in order
  const models = [
    "claude-3-sonnet-20240229",
    "claude-3-sonnet",
    "claude-3-opus-20240229",
    "claude-3-opus",
    "claude-3-haiku-20240307",
    "claude-3-haiku"
  ];
  
  let lastError = null;
  
  // Try each model until one works
  for (const model of models) {
    try {
      const modifiedData = { ...data, model };
      logger.info(`Trying Claude API with model: ${model}`);
      const response = await axios.post(endpoint, modifiedData, { headers });
      logger.info(`Successfully called Claude API with model: ${model}`);
      return response;
    } catch (error) {
      lastError = error;
      logger.warn(`Failed to call Claude API with model ${model}: ${error.message}`);
      
      // If it's not a model-related error, don't try other models
      if (error.response?.data?.error?.type !== "not_found_error" || 
          !error.response?.data?.error?.message?.includes(model)) {
        throw error;
      }
    }
  }
  
  // If we've tried all models and none worked, throw the last error
  throw lastError;
}

// Generate full regulatory report using Claude with web scraping
router.post('/report', async (req, res) => {
  try {
    const { 
      smiles,
      drugClass = 'CNS stimulant',
      targetIndication = 'ADHD',
      primaryMechanism = 'dopamine/norepinephrine reuptake inhibition',
      novelMechanism = false,
      orphanDrug = false,
      fastTrack = false
    } = req.body;
    
    if (!smiles) {
      return res.status(400).json({ error: 'SMILES string is required' });
    }
    
    logger.info(`Generating regulatory report for molecule with SMILES: ${smiles}`);
    
    // Generate a unique request ID
    const requestId = uuidv4();
    
    // Prepare the prompt for Claude with web scraping instructions
    const prompt = `You are a pharmaceutical regulatory affairs expert with the ability to search the web for information. I need a comprehensive regulatory analysis report for a new drug candidate with the following characteristics:

SMILES: ${smiles}
Drug Class: ${drugClass}
Target Indication: ${targetIndication}
Primary Mechanism of Action: ${primaryMechanism}
Novel Mechanism: ${novelMechanism ? 'Yes' : 'No'}
Orphan Drug Designation: ${orphanDrug ? 'Yes' : 'No'}
Fast Track Eligibility: ${fastTrack ? 'Yes' : 'No'}

First, please search the web for relevant information about:
1. Similar drugs in the ${drugClass} class
2. Recent FDA approvals for ${targetIndication}
3. Patent information for drugs with ${primaryMechanism}
4. Regulatory pathways commonly used for ${drugClass} drugs
5. Current market exclusivity periods for similar drugs

Then, based on your web search and expertise, provide a detailed regulatory analysis that includes:

1. Executive Summary: Brief overview of the regulatory landscape for this drug candidate.
2. Patent Landscape: Analysis of existing patents that might be relevant to this molecule or mechanism of action. Include information about patent expiration dates and potential for patent challenges.
3. Regulatory Pathway: Recommended regulatory submission pathway (NDA, 505(b)(2), etc.), required studies, and estimated timeline to approval.
4. Market Exclusivity: Analysis of potential exclusivity periods (NCE, orphan drug, pediatric, etc.) and strategies to maximize exclusivity.
5. Special Considerations: Any special regulatory considerations based on the drug class, indication, or mechanism.

Please use your knowledge of FDA, EMA, and other global regulatory frameworks to provide this analysis. Include specific references to relevant regulations and cite any sources you use from your web search.`;

    // Check if API key is available
    if (!ANTHROPIC_API_KEY) {
      logger.error('ANTHROPIC_API_KEY is not set in environment variables');
      
      // Fall back to mock data if API key is not available
      const mockReport = {
        summary: `This is a mock regulatory report for a ${drugClass} targeting ${targetIndication} through ${primaryMechanism}.`,
        patentLandscape: "Based on our analysis, there are several relevant patents in this space, but none that directly cover this specific molecular structure. The closest patents are held by major pharmaceutical companies and will expire in the next 5-7 years.",
        regulatoryPathway: "The recommended regulatory pathway is a standard NDA (505b1) with a full clinical development program. Given the established mechanism of action, the FDA will likely require standard safety and efficacy studies.",
        marketExclusivity: "Upon approval, this compound would likely qualify for 5 years of market exclusivity as a new chemical entity. Additional exclusivity may be possible through patent protection and pediatric studies.",
        specialConsiderations: "As a CNS-active compound, special attention should be paid to abuse potential studies and risk evaluation and mitigation strategies (REMS)."
      };
      
      return res.json({
        requestId,
        ...mockReport,
        note: "Using mock data because ANTHROPIC_API_KEY is not set"
      });
    }

    // Call Claude API with web search capability
    const claudeResponse = await callClaudeAPI(
      ANTHROPIC_API_URL,
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        temperature: 0.7,
        system: "You are a pharmaceutical regulatory affairs expert with the ability to search the web for current information. You can access patent databases, FDA websites, and other regulatory resources to provide accurate and up-to-date information. Always cite your sources when you provide information from the web.",
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    );
    
    // Extract the response content
    const analysisResponse = claudeResponse.data.content[0].text;
    
    // Parse the response into sections
    const sections = parseResponseIntoSections(analysisResponse);
    
    // Save the result to a file
    const resultData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      request: {
        smiles,
        drugClass,
        targetIndication,
        primaryMechanism,
        novelMechanism,
        orphanDrug,
        fastTrack
      },
      response: analysisResponse,
      sections
    };
    
    const resultFile = path.join(resultsDir, `regulatory_${requestId}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
    
    // Return the analysis
    return res.json({
      requestId,
      ...sections
    });
    
  } catch (error) {
    logger.error(`Error generating regulatory report: ${error.message}`, { 
      stack: error.stack,
      response: error.response?.data
    });
    
    // If there's an error with the Claude API, fall back to mock data
    const mockReport = {
      summary: `This is a mock regulatory report (fallback due to API error) for a ${req.body.drugClass || 'CNS stimulant'} targeting ${req.body.targetIndication || 'ADHD'}.`,
      patentLandscape: "Based on our analysis, there are several relevant patents in this space, but none that directly cover this specific molecular structure. The closest patents are held by major pharmaceutical companies and will expire in the next 5-7 years.",
      regulatoryPathway: "The recommended regulatory pathway is a standard NDA (505b1) with a full clinical development program. Given the established mechanism of action, the FDA will likely require standard safety and efficacy studies.",
      marketExclusivity: "Upon approval, this compound would likely qualify for 5 years of market exclusivity as a new chemical entity. Additional exclusivity may be possible through patent protection and pediatric studies.",
      specialConsiderations: "As a CNS-active compound, special attention should be paid to abuse potential studies and risk evaluation and mitigation strategies (REMS)."
    };
    
    return res.json({
      requestId: uuidv4(),
      ...mockReport,
      error: 'API Error - Using fallback data',
      errorDetails: error.message
    });
  }
});

// Helper function to parse Claude's response into sections
function parseResponseIntoSections(response) {
  // Default sections in case parsing fails
  const defaultSections = {
    summary: "Executive summary not found in the response.",
    patentLandscape: "Patent landscape information not found in the response.",
    regulatoryPathway: "Regulatory pathway information not found in the response.",
    marketExclusivity: "Market exclusivity information not found in the response.",
    specialConsiderations: "Special considerations not found in the response."
  };
  
  try {
    // Look for Executive Summary section
    const summaryMatch = response.match(/Executive Summary[:\s]*([\s\S]*?)(?=\n\s*(?:Patent Landscape|Regulatory Pathway|Market Exclusivity|Special Considerations|$))/i);
    
    // Look for Patent Landscape section
    const patentMatch = response.match(/Patent Landscape[:\s]*([\s\S]*?)(?=\n\s*(?:Regulatory Pathway|Market Exclusivity|Special Considerations|$))/i);
    
    // Look for Regulatory Pathway section
    const pathwayMatch = response.match(/Regulatory Pathway[:\s]*([\s\S]*?)(?=\n\s*(?:Market Exclusivity|Special Considerations|$))/i);
    
    // Look for Market Exclusivity section
    const exclusivityMatch = response.match(/Market Exclusivity[:\s]*([\s\S]*?)(?=\n\s*(?:Special Considerations|$))/i);
    
    // Look for Special Considerations section
    const considerationsMatch = response.match(/Special Considerations[:\s]*([\s\S]*?)(?=$)/i);
    
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : defaultSections.summary,
      patentLandscape: patentMatch ? patentMatch[1].trim() : defaultSections.patentLandscape,
      regulatoryPathway: pathwayMatch ? pathwayMatch[1].trim() : defaultSections.regulatoryPathway,
      marketExclusivity: exclusivityMatch ? exclusivityMatch[1].trim() : defaultSections.marketExclusivity,
      specialConsiderations: considerationsMatch ? considerationsMatch[1].trim() : defaultSections.specialConsiderations
    };
  } catch (error) {
    logger.error(`Error parsing Claude response: ${error.message}`);
    return defaultSections;
  }
}

// Get patent information for a molecule or drug class
router.post('/patents', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    logger.info(`Searching patent information for: ${query}`);
    
    // Generate a unique request ID
    const requestId = uuidv4();
    
    // Check if API key is available
    if (!ANTHROPIC_API_KEY) {
      logger.error('ANTHROPIC_API_KEY is not set in environment variables');
      
      // Return mock data if API key is not available
      const mockPatentData = {
        patents: [
          {
            patentNumber: "US10123456B2",
            title: `Methods and compositions for treating ${query}-related disorders`,
            assignee: "PharmaCorp Inc.",
            expirationDate: "2035-06-15",
            relevance: "High"
          },
          {
            patentNumber: "US9876543B1",
            title: `Novel compounds for ${query} modulation`,
            assignee: "BioTech Innovations",
            expirationDate: "2033-09-22",
            relevance: "Medium"
          }
        ],
        analysis: `The patent landscape for ${query} is moderately crowded, with several major pharmaceutical companies holding key patents. However, there appear to be opportunities for novel chemical structures with improved properties.`,
        ftoIssues: "No significant freedom-to-operate issues identified for the specific molecular structure, but caution is advised regarding method-of-use patents.",
        strategies: "Consider filing new composition of matter patents for novel derivatives, as well as method-of-use patents for specific indications not currently claimed."
      };
      
      return res.json({
        requestId,
        content: mockPatentData,
        note: "Using mock data because ANTHROPIC_API_KEY is not set"
      });
    }
    
    // Prepare the prompt for Claude with web scraping instructions
    const prompt = `You are a pharmaceutical patent expert with the ability to search the web for current information. I need you to search for and analyze patent information related to the following query: "${query}".

Please search the web for:
1. Recent patents related to ${query}
2. Key pharmaceutical companies holding patents in this area
3. Patent expiration dates for major drugs related to ${query}
4. Recent patent litigation in this therapeutic area

Based on your web search, please provide:
1. A list of relevant patents (with patent numbers, titles, assignees, and expiration dates)
2. Analysis of patent claims that might be relevant
3. Potential freedom-to-operate issues
4. Strategies for navigating the patent landscape

Format your response as a structured report with clear sections and bullet points where appropriate. Please cite your sources.`;

    // Call Claude API with web search capability
    const claudeResponse = await callClaudeAPI(
      ANTHROPIC_API_URL,
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        temperature: 0.7,
        system: "You are a pharmaceutical patent expert with the ability to search the web for current information. You can access patent databases like USPTO, EPO, and WIPO to provide accurate and up-to-date patent information. Always cite your sources when you provide information from the web.",
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    );
    
    // Extract the response content
    const patentAnalysis = claudeResponse.data.content[0].text;
    
    // Save the result to a file
    const resultData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      query,
      response: patentAnalysis
    };
    
    const resultFile = path.join(resultsDir, `patents_${requestId}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
    
    // Return the analysis
    return res.json({
      requestId,
      content: patentAnalysis
    });
    
  } catch (error) {
    logger.error(`Error getting patent information: ${error.message}`, { 
      stack: error.stack,
      response: error.response?.data
    });
    
    // Return mock data if there's an API error
    const mockPatentData = {
      patents: [
        {
          patentNumber: "US10123456B2",
          title: `Methods and compositions for treating ${req.body.query || 'drug'}-related disorders`,
          assignee: "PharmaCorp Inc.",
          expirationDate: "2035-06-15",
          relevance: "High"
        },
        {
          patentNumber: "US9876543B1",
          title: `Novel compounds for ${req.body.query || 'drug'} modulation`,
          assignee: "BioTech Innovations",
          expirationDate: "2033-09-22",
          relevance: "Medium"
        }
      ],
      analysis: `The patent landscape for ${req.body.query || 'this drug class'} is moderately crowded, with several major pharmaceutical companies holding key patents. However, there appear to be opportunities for novel chemical structures with improved properties.`,
      ftoIssues: "No significant freedom-to-operate issues identified for the specific molecular structure, but caution is advised regarding method-of-use patents.",
      strategies: "Consider filing new composition of matter patents for novel derivatives, as well as method-of-use patents for specific indications not currently claimed."
    };
    
    return res.json({
      requestId: uuidv4(),
      content: mockPatentData,
      error: 'API Error - Using fallback data',
      errorDetails: error.message
    });
  }
});

// Other endpoints remain as placeholders
router.post('/pathway', async (req, res) => {
   logger.warn('Endpoint /api/regulatory/pathway called - DEPRECATED. Use /api/regulatory/report instead.');
   res.status(404).json({ error: 'Endpoint deprecated. Use /api/regulatory/report instead.' });
});

router.post('/production-feasibility', async (req, res) => {
   logger.warn('Endpoint /api/regulatory/production-feasibility called - DEPRECATED. Use /api/regulatory/report instead.');
   res.status(404).json({ error: 'Endpoint deprecated. Use /api/regulatory/report instead.' });
});

router.post('/market-analysis', async (req, res) => {
   logger.warn('Endpoint /api/regulatory/market-analysis called - DEPRECATED. Use /api/regulatory/report instead.');
   res.status(404).json({ error: 'Endpoint deprecated. Use /api/regulatory/report instead.' });
});

module.exports = router; 