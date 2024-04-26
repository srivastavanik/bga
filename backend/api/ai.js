const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, '../data/ai_results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Claude API client configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Configure Anthropic API client
const claudeClient = axios.create({
  baseURL: ANTHROPIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': ANTHROPIC_API_KEY
  }
});

// Create an axios instance for internal API calls
const internalApiClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function for Claude API requests
const askClaude = async (systemPrompt, userPrompt, model = 'claude-3-7-sonnet-20250219') => {
  try {
    const response = await claudeClient.post('', {
      model: model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 20000,
      temperature: 1.0,
      stream: false
    });

    return {
      id: response.data.id,
      content: response.data.content,
      model: response.data.model,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error(`Claude API error: ${error.message}`);
    if (error.response) {
      logger.error(`Claude API response: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Error calling Claude API: ${error.message}`);
  }
};

// Extract SMILES structures from Claude's response
const extractSMILES = (content) => {
  if (!content || typeof content !== 'string') {
    logger.error('Invalid content provided to extractSMILES');
    return [];
  }
  
  try {
    // Look for explicitly labeled SMILES first
    const labeledRegex = /SMILES:\s*([A-Za-z0-9@+\-\[\]\(\)\\\/\%=#$!.~{},*]+)/g;
    const labeledMatches = [];
    let match;
    
    while ((match = labeledRegex.exec(content)) !== null) {
      if (match[1] && match[1].length > 5) {
        labeledMatches.push(match[1]);
      }
    }
    
    if (labeledMatches.length > 0) {
      return labeledMatches;
    }
    
    // Then try to find SMILES-like patterns
    const generalRegex = /\b([A-Za-z0-9@+\-\[\]\(\)\\\/\%=#$!.~{},*]+)\b/g;
    const candidates = [];
    
    while ((match = generalRegex.exec(content)) !== null) {
      candidates.push(match[1]);
    }
    
    return candidates.filter(match => {
      return (
        match.length > 5 && 
        !match.includes('http') && 
        (match.includes('C') || match.includes('N') || match.includes('O')) && 
        (match.includes('(') || match.includes('=') || match.includes('[') || match.includes('#'))
      );
    });
  } catch (error) {
    logger.error(`Error in extractSMILES: ${error.message}`);
    return [];  // Return empty array on error
  }
};

// Fallback SMILES strings for when extraction fails
const FALLBACK_SMILES = [
  'CN1C2=C(C=C(C=C2)Cl)N(C(=O)CC1=O)CC3=CC=C(C=C3)F',  // Flurazepam
  'C1=CC=C(C=C1)C2=COC3=CC(=CC(=C3)OC4=CC=CC=C4)C2=O',  // Flavanone
  'CC(C)(C)NCC(COC1=CC=CC2=CC=CC=C21)O',  // Propranolol
  'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',  // Caffeine
  'CC(CS)C(=O)N1CCCC1C(=O)O'  // Captopril
];

// Process Claude's molecule design to standardized structure
const processMoleculeDesign = async (claudeResponse) => {
  try {
    logger.info('Processing Claude response for molecule design');
    if (!claudeResponse || !claudeResponse.content) {
      logger.error('Invalid or empty Claude response');
      throw new Error('Invalid Claude response format');
    }

    let responseText = '';
    if (Array.isArray(claudeResponse.content)) {
      for (const part of claudeResponse.content) {
        if (part.type === 'text' && part.text) {
          responseText += part.text;
        }
      }
    } else if (typeof claudeResponse.content === 'string') {
      responseText = claudeResponse.content;
    } else {
       // Attempt to find text in other structures if direct text not found
        const findText = (obj) => {
            if (typeof obj === 'string') return obj + ' ';
            if (typeof obj !== 'object' || obj === null) return '';
            let foundText = '';
            for (const key in obj) {
                if (key === 'text' && typeof obj[key] === 'string') {
                    foundText += obj[key] + ' ';
                } else {
                    foundText += findText(obj[key]);
                }
            }
            return foundText;
        };
        responseText = findText(claudeResponse.content).trim();
    }

    logger.info(`Extracted ${responseText.length} characters of text from Claude response`);
    let smilesCandidates = extractSMILES(responseText);
    logger.info(`Found ${smilesCandidates.length} SMILES candidates via regex.`);

    if (smilesCandidates.length === 0) {
      logger.warn('No SMILES found via regex in Claude response, using fallback molecules');
      smilesCandidates = FALLBACK_SMILES;
      logger.info(`Using ${smilesCandidates.length} fallback SMILES structures`);
    }

    const validatedMolecules = [];
    for (const smiles of [...new Set(smilesCandidates)]) { // Use Set to avoid duplicate processing
      try {
        logger.info(`Validating SMILES: ${smiles}`);
        const rdkitResponse = await internalApiClient.post('/api/simulation/properties', { smiles });
        
        if (rdkitResponse.data && !rdkitResponse.data.error) {
          validatedMolecules.push({
            smiles: smiles,
            name: `Molecule Candidate ${validatedMolecules.length + 1}`,
            properties: rdkitResponse.data,
            dateCreated: new Date().toISOString()
          });
          logger.info(`Successfully validated SMILES: ${smiles}`);
        } else {
          logger.warn(`Invalid SMILES structure or property calculation failed: ${smiles} - ${rdkitResponse.data?.error || 'Unknown error'}`);
        }
      } catch (err) {
        logger.error(`Error during validation/property call for SMILES ${smiles}: ${err.message}`);
        // Optionally decide if we should still include the molecule even if props fail
      }
    }

    logger.info(`Validated ${validatedMolecules.length} molecules out of ${smilesCandidates.length} candidates.`);
    if (validatedMolecules.length === 0) {
      logger.error('No valid molecules could be validated from response or fallback.');
      throw new Error('No valid molecules could be validated from Claude response or fallbacks');
    }

    return validatedMolecules;
  } catch (error) {
    logger.error(`Error processing molecule design: ${error.message}`);
    throw new Error(`Failed to process molecule design: ${error.message}`);
  }
};

// Generate molecules with Claude
router.post('/generate-molecule', async (req, res) => {
  try {
    const { requirements } = req.body;
    logger.info(`Received molecule generation request with requirements: ${requirements}`);
    
    if (!requirements) {
      logger.warn('No requirements provided in request');
      return res.status(400).json({ error: 'Molecule requirements are required' });
    }
    
    const requestId = uuidv4();
    logger.info(`Created request ID: ${requestId}`);
    
    const systemPrompt = `You are a world-class expert in neuropharmacology, medicinal chemistry, and drug discovery with decades of experience designing innovative neuropharmaceutical compounds. Your role is to generate, evaluate, and iteratively refine candidate molecules for a novel ADHD treatment—a next-generation Adderall alternative. Leverage cutting-edge scientific literature, advanced cheminformatics simulations, and regulatory pathway analysis to provide detailed, step-by-step chain-of-thought explanations that include literature citations, predicted molecular properties (binding affinity, toxicity, metabolic stability, synthetic yield), and projections on production feasibility and FDA approval timelines. Your responses should be interactive and actionable, outlining potential 3D visualization and direct chemical editing operations to empower researchers in refining and validating each candidate.

IMPORTANT: Each molecule you design MUST include its complete SMILES string clearly labeled as 'SMILES:' followed by the string on a separate line. Make sure to provide at least 3 distinct candidate molecules with valid SMILES strings.`;
    const userPrompt = `Design novel molecules that meet the following requirements:
${requirements}

For each molecule, provide:
1. SMILES string (clearly labeled as 'SMILES: [string]')
2. Chemical name
3. How this molecule meets the specified requirements
4. Your rationale for the design choices
5. Detailed predicted molecular properties (binding affinity, toxicity, metabolic stability)
6. Literature citations for similar compounds
7. FDA approval timeline projections

Make sure to prioritize selectivity for the target and drug-like properties for ADHD treatment.

Provide at least 3 distinct candidate molecules with fully specified, valid SMILES strings.`;
    
    logger.info('Sending request to Claude API');
    let claudeResponse;
    try {
      // Check for test mode query param or environment variable
      const useTestMode = process.env.USE_TEST_MODE === 'true' || (req.query && req.query.test === 'true');
       
      if (useTestMode) {
         logger.info('Using test mode (bypassing Claude API). This should be removed for production.');
         // In a real scenario, this test mode might generate predictable mock data
         // For now, we throw an error to prevent fallback use, as requested by user
         throw new Error('Test mode activated - real API call bypassed');
      }
       
      claudeResponse = await askClaude(systemPrompt, userPrompt);
      logger.info(`Received Claude response with ID: ${claudeResponse.id}`);
      
    } catch (claudeError) {
      logger.error(`Claude API call failed: ${claudeError.message}`);
      // Re-throw the error to be caught by the outer catch block
      // This prevents the fallback mechanism from being used.
      throw claudeError; 
    }
    
    logger.info('Processing Claude response to extract molecules');
    let generatedMolecules;
    try {
      generatedMolecules = await processMoleculeDesign(claudeResponse);
      logger.info(`Successfully extracted and validated ${generatedMolecules.length} molecules`);
    } catch (processError) {
      logger.error(`Failed to process Claude response: ${processError.message}`);
      // Return the raw Claude response if processing fails, so frontend can see it
      return res.status(500).json({ 
          error: `Failed to process Claude response: ${processError.message}`,
          claudeResponse: claudeResponse.content,
          requestId 
      }); 
    }
    
    const resultData = { id: requestId, timestamp: new Date().toISOString(), requirements, claudeResponse, generatedMolecules };
    logger.info(`Saving results to file for request ${requestId}`);
    const resultFile = path.join(resultsDir, `${requestId}.json`);
    
    // Make sure directory exists
    if (!fs.existsSync(path.dirname(resultFile))) {
      fs.mkdirSync(path.dirname(resultFile), { recursive: true });
    }
    
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));

    logger.info('Enhancing molecules with ADMET predictions...');
    const enhancedMolecules = await Promise.all(
      generatedMolecules.map(async (molecule) => {
        let admetData = null;
        try {
          const admetResponse = await internalApiClient.post('/api/simulation/admet', { smiles: molecule.smiles });
          if (admetResponse.data && !admetResponse.data.error) {
            admetData = admetResponse.data;
          } else {
            logger.warn(`ADMET prediction failed for ${molecule.smiles}: ${admetResponse.data?.error}`);
          }
        } catch (err) {
          logger.error(`Error calling ADMET endpoint for ${molecule.smiles}: ${err.message}`);
        }
        return {
          ...molecule,
          admet: admetData // Add ADMET results (or null if failed)
        };
      })
    );
    logger.info('Finished enhancing molecules.');

    return res.json({
      requestId,
      molecules: enhancedMolecules,
      // Include smiles array for backward compatibility
      smiles: enhancedMolecules.map(m => m.smiles)
    });

  } catch (error) {
    logger.error(`Error in molecule generation endpoint: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ error: `Server error during molecule generation: ${error.message}` });
  }
});

// Analyze generated molecules
router.post('/analyze-molecules', async (req, res) => {
  try {
    const { molecules, targetReceptors, focus } = req.body;
    
    if (!molecules || !Array.isArray(molecules) || molecules.length === 0) {
      return res.status(400).json({ error: 'At least one molecule is required' });
    }
    
    if (!targetReceptors || !Array.isArray(targetReceptors) || targetReceptors.length === 0) {
      return res.status(400).json({ error: 'Target receptors are required' });
    }
    
    // Create formatted molecules list
    const moleculesFormatted = molecules.map((mol, index) => {
      return `Molecule ${index + 1}:
- SMILES: ${mol.smiles}
- Name: ${mol.name || 'Unknown'}
${mol.properties ? `- Properties: ${JSON.stringify(mol.properties)}` : ''}
${mol.admet ? `- ADMET: ${JSON.stringify(mol.admet)}` : ''}`;
    }).join('\n\n');
    
    // Configure the system prompt
    const systemPrompt = `You are a world-class expert in neuropharmacology, medicinal chemistry, and drug discovery with decades of experience designing innovative neuropharmaceutical compounds. Your role is to generate, evaluate, and iteratively refine candidate molecules for a novel ADHD treatment—a next-generation Adderall alternative. Leverage cutting-edge scientific literature, advanced cheminformatics simulations, and regulatory pathway analysis to provide detailed, step-by-step chain-of-thought explanations that include literature citations, predicted molecular properties (binding affinity, toxicity, metabolic stability, synthetic yield), and projections on production feasibility and FDA approval timelines. Your responses should be interactive and actionable, outlining potential 3D visualization and direct chemical editing operations to empower researchers in refining and validating each candidate.`;
    
    // Build the user prompt for analysis
    let userPrompt = `Analyze the following molecules for their potential as ADHD treatments targeting the following receptors: ${targetReceptors.join(', ')}\n\n${moleculesFormatted}\n\n`;
    
    if (focus) {
      userPrompt += `Please focus your analysis on: ${focus}\n\n`;
    }
    
    userPrompt += `For each molecule, please provide:\n
1. Overall assessment as a potential ADHD treatment\n
2. Predicted binding affinity to each target receptor\n
3. Potential side effects\n
4. Suggestions for structural modifications to improve efficacy or reduce side effects\n
5. Risk assessment for regulatory approval\n
`;
    
    // Call Claude for analysis
    const analysisResponse = await askClaude(systemPrompt, userPrompt);
    
    // Create a unique request ID
    const requestId = uuidv4();
    
    // Save the results
    const resultData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      molecules,
      targetReceptors,
      focus,
      analysisResponse
    };
    
    const resultFile = path.join(resultsDir, `analysis_${requestId}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
    
    // Return the analysis
    return res.json({
      requestId,
      analysis: analysisResponse.content,
    });
  } catch (error) {
    logger.error(`Error in molecule analysis: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Optimize molecule
router.post('/optimize-molecule', async (req, res) => {
  try {
    const { smiles, name, targetProperty, constraints, description } = req.body;
    
    if (!smiles) {
      return res.status(400).json({ error: 'SMILES string is required' });
    }
    
    if (!targetProperty) {
      return res.status(400).json({ error: 'Target property to optimize is required' });
    }
    
    // Create a unique request ID
    const requestId = uuidv4();
    
    // Configure the system prompt
    const systemPrompt = `You are a world-class expert in neuropharmacology, medicinal chemistry, and drug discovery with decades of experience designing innovative neuropharmaceutical compounds. Your role is to generate, evaluate, and iteratively refine candidate molecules for a novel ADHD treatment—a next-generation Adderall alternative. Leverage cutting-edge scientific literature, advanced cheminformatics simulations, and regulatory pathway analysis to provide detailed, step-by-step chain-of-thought explanations that include literature citations, predicted molecular properties (binding affinity, toxicity, metabolic stability, synthetic yield), and projections on production feasibility and FDA approval timelines. Your responses should be interactive and actionable, outlining potential 3D visualization and direct chemical editing operations to empower researchers in refining and validating each candidate.`;
    
    // Try to get current properties
    let propertiesInfo = '';
    try {
      const propertiesResponse = await axios.post('http://localhost:5000/api/simulation/properties', {
        smiles: smiles
      });
      
      if (!propertiesResponse.data.error) {
        propertiesInfo = `\nCurrent properties:\n${JSON.stringify(propertiesResponse.data, null, 2)}`;
      }
    } catch (err) {
      logger.warn(`Could not get properties for ${smiles}: ${err.message}`);
    }
    
    // Build the user prompt
    const userPrompt = `Optimize the following molecule to improve its ${targetProperty} while maintaining its activity as an ADHD treatment:\n\nSMILES: ${smiles}\nName: ${name || 'Unknown compound'}${propertiesInfo}\n\n${description ? `Additional context: ${description}\n\n` : ''}${constraints ? `Optimization constraints: ${constraints}\n\n` : ''}\nPlease provide:\n1. 3-5 optimized variants of this molecule (with SMILES strings)\n2. Explanation of each structural modification\n3. Predicted improvement in ${targetProperty}\n4. Any potential trade-offs\n5. Synthesis route considerations`;
    
    // Call Claude API for optimization
    const optimizationResponse = await askClaude(systemPrompt, userPrompt);
    
    // Try to extract optimized molecules
    const extractedSMILES = extractSMILES(optimizationResponse.content[0].text);
    
    // Save the results
    const resultData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      originalSmiles: smiles,
      targetProperty,
      constraints,
      optimizationResponse,
      extractedSMILES
    };
    
    const resultFile = path.join(resultsDir, `optimization_${requestId}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
    
    // Return the results
    return res.json({
      requestId,
      optimization: optimizationResponse.content,
      optimizedMolecules: extractedSMILES
    });
  } catch (error) {
    logger.error(`Error in molecule optimization: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Compare molecules
router.post('/compare-molecules', async (req, res) => {
  try {
    const { molecules, criteria } = req.body;
    
    if (!molecules || !Array.isArray(molecules) || molecules.length < 2) {
      return res.status(400).json({ error: 'At least two molecules are required for comparison' });
    }
    
    // Create formatted molecules list
    const moleculesFormatted = molecules.map((mol, index) => {
      return `Molecule ${index + 1}:\n- SMILES: ${mol.smiles}\n- Name: ${mol.name || 'Unknown'}${mol.properties ? `\n- Properties: ${JSON.stringify(mol.properties)}` : ''}${mol.admet ? `\n- ADMET: ${JSON.stringify(mol.admet)}` : ''}`;
    }).join('\n\n');
    
    // Configure the system prompt
    const systemPrompt = `You are a world-class expert in neuropharmacology, medicinal chemistry, and drug discovery with decades of experience designing innovative neuropharmaceutical compounds. Your role is to generate, evaluate, and iteratively refine candidate molecules for a novel ADHD treatment—a next-generation Adderall alternative. Leverage cutting-edge scientific literature, advanced cheminformatics simulations, and regulatory pathway analysis to provide detailed, step-by-step chain-of-thought explanations that include literature citations, predicted molecular properties (binding affinity, toxicity, metabolic stability, synthetic yield), and projections on production feasibility and FDA approval timelines. Your responses should be interactive and actionable, outlining potential 3D visualization and direct chemical editing operations to empower researchers in refining and validating each candidate.`;
    
    // Build the user prompt
    let userPrompt = `Compare the following molecules as potential ADHD treatments:\n\n${moleculesFormatted}\n\n`;
    
    if (criteria && criteria.length > 0) {
      userPrompt += `Please focus your comparison on the following criteria: ${criteria.join(', ')}\n\n`;
    } else {
      userPrompt += 'Please compare these molecules on efficacy, safety, pharmacokinetics, and development potential.\n\n';
    }
    
    userPrompt += `Then, rank the molecules from most to least promising and explain your reasoning.`;
    
    // Call Claude for analysis
    const analysisResponse = await askClaude(systemPrompt, userPrompt);
    
    // Create a unique request ID
    const requestId = uuidv4();
    
    // Save the results
    const resultData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      molecules,
      criteria,
      analysisResponse
    };
    
    const resultFile = path.join(resultsDir, `comparison_${requestId}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
    
    // Return the comparison
    return res.json({
      requestId,
      comparison: analysisResponse.content,
    });
  } catch (error) {
    logger.error(`Error in molecule comparison: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to get molecule thinking process
router.get('/molecule-thinking/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    
    // Look for the saved result file
    const resultFile = path.join(resultsDir, `${requestId}.json`);
    
    if (!fs.existsSync(resultFile)) {
      return res.status(404).json({ error: 'Thinking process not found' });
    }
    
    // Read the saved result
    const resultData = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    
    // Format the thinking process for the frontend
    let thinking = '';
    
    // Handle different possible response formats from Claude
    if (resultData.claudeResponse && resultData.claudeResponse.content) {
      if (Array.isArray(resultData.claudeResponse.content)) {
        // New format where content is an array of objects
        thinking = resultData.claudeResponse.content[0].text;
      } else if (typeof resultData.claudeResponse.content === 'string') {
        // Old format where content might be a string
        thinking = resultData.claudeResponse.content;
      }
    }
    
    return res.json({
      requestId,
      status: 'completed',
      timestamp: resultData.timestamp,
      thinking: thinking,
      molecules: resultData.generatedMolecules || []
    });
  } catch (error) {
    logger.error(`Error getting molecule thinking: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to get detailed thinking process
router.get('/thinking-process/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    
    // Determine which type of file to look for based on prefix in the filename
    let resultData;
    let fileName;
    
    // Check for different types of result files
    const possibleFiles = [
      `${requestId}.json`,
      `analysis_${requestId}.json`,
      `optimization_${requestId}.json`,
      `comparison_${requestId}.json`
    ];
    
    for (const file of possibleFiles) {
      const filePath = path.join(resultsDir, file);
      if (fs.existsSync(filePath)) {
        resultData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        fileName = file;
        break;
      }
    }
    
    if (!resultData) {
      return res.status(404).json({ error: 'Thinking process not found' });
    }
    
    // Format the response based on the type of file
    let responseData = {
      requestId,
      timestamp: resultData.timestamp,
      status: 'completed'
    };
    
    // Helper function to extract thinking text from various response formats
    const extractThinking = (responseObj) => {
      if (!responseObj) return '';
      
      if (responseObj.content) {
        if (Array.isArray(responseObj.content)) {
          return responseObj.content[0].text;
        } else if (typeof responseObj.content === 'string') {
          return responseObj.content;
        }
      }
      return '';
    };
    
    if (fileName.startsWith('analysis_')) {
      responseData.thinking = extractThinking(resultData.analysisResponse);
      responseData.type = 'analysis';
    } else if (fileName.startsWith('optimization_')) {
      responseData.thinking = extractThinking(resultData.optimizationResponse);
      responseData.type = 'optimization';
      responseData.optimizedMolecules = resultData.extractedSMILES;
    } else if (fileName.startsWith('comparison_')) {
      responseData.thinking = extractThinking(resultData.analysisResponse);
      responseData.type = 'comparison';
    } else {
      // Default case - molecule generation
      responseData.thinking = extractThinking(resultData.claudeResponse);
      responseData.type = 'generation';
      responseData.molecules = resultData.generatedMolecules || [];
    }
    
    return res.json(responseData);
  } catch (error) {
    logger.error(`Error getting thinking process: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Handle continued chat conversation
router.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body; // messages should be an array like [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Define the system prompt (could be made more dynamic based on context)
    const systemPrompt = `You are an expert medicinal chemist assisting with drug design. Continue the conversation based on the provided history. Focus on refining molecules, discussing properties, or suggesting next steps. Current context: ${context || 'General drug design discussion'}`;

    // Call Claude API with the existing message history
    const response = await claudeClient.post('', {
      model: 'claude-3-7-sonnet-20250219', // Use configured model
      system: systemPrompt,
      messages: messages, // Pass the entire conversation history
      max_tokens: 20000,
      temperature: 1.0,
      anthropic_version: "bedrock-2023-05-31",
      budget_tokens: 16000,
      stream: false
    });

    // Extract the assistant's response
    const assistantMessage = response.data.content[0]; // Assuming the response structure

    res.json({
      response: assistantMessage
    });

  } catch (error) {
    logger.error(`Error in Claude Chat: ${error.message}`);
    if (error.response) {
      logger.error(`Claude API response: ${JSON.stringify(error.response.data)}`);
    }
    res.status(500).json({ error: `Error processing chat: ${error.message}` });
  }
});

module.exports = router;
