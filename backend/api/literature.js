const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const router = express.Router();
const logger = require('../utils/logger'); // Added logger

// PubMed API base URLs
const PUBMED_ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_ELINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
const BIOC_PMC_URL = 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json';

// Search literature by keyword
router.get('/pubmed', async (req, res) => { // Changed endpoint to /pubmed
  try {
    const { query, limit = 10, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const retStart = (page - 1) * limit;
    const searchQuery = `${query} AND (ADHD OR attention deficit hyperactivity disorder OR neuropharmacology OR stimulant OR neurotransmitter)`;
    
    logger.info(`Searching PubMed for: ${searchQuery}, limit: ${limit}, start: ${retStart}`);

    const searchResponse = await axios.get(PUBMED_ESEARCH_URL, {
      params: {
        db: 'pubmed',
        term: searchQuery,
        retmax: limit,
        retstart: retStart,
        retmode: 'json',
        sort: 'relevance'
      }
    });
    
    const idList = searchResponse.data.esearchresult?.idlist || [];
    const totalCount = parseInt(searchResponse.data.esearchresult?.count || '0');

    logger.info(`Found ${idList.length} IDs (total ${totalCount})`);
    
    if (idList.length === 0) {
      return res.json({ results: [], total: 0 });
    }
    
    const fetchResponse = await axios.get(PUBMED_EFETCH_URL, {
      params: {
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'xml'
      }
    });
    
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(fetchResponse.data);
    
    const articles = result.PubmedArticleSet?.PubmedArticle ? 
      (Array.isArray(result.PubmedArticleSet.PubmedArticle) ? result.PubmedArticleSet.PubmedArticle : [result.PubmedArticleSet.PubmedArticle]) 
      : [];
    
    const formattedArticles = articles.map(article => {
      const medlineCitation = article?.MedlineCitation;
      const articleData = medlineCitation?.Article;
      const pubmedData = article?.PubmedData;

      if (!medlineCitation || !articleData) {
          logger.warn(`Skipping article with missing data: ${JSON.stringify(article)}`);
          return null;
      }
      
      let authors = [];
      if (articleData.AuthorList && articleData.AuthorList.Author) {
          const authorList = Array.isArray(articleData.AuthorList.Author) ? articleData.AuthorList.Author : [articleData.AuthorList.Author];
          authors = authorList.map(author => (
            author.LastName && author.ForeName ? `${author.LastName}, ${author.ForeName}` : author.LastName || author.CollectiveName || ''
          )).filter(Boolean);
      }
      
      let abstract = '';
      if (articleData.Abstract && articleData.Abstract.AbstractText) {
        abstract = Array.isArray(articleData.Abstract.AbstractText) 
          ? articleData.Abstract.AbstractText.map(t => typeof t === 'string' ? t : t._).join(' ') 
          : (typeof articleData.Abstract.AbstractText === 'string' ? articleData.Abstract.AbstractText : articleData.Abstract.AbstractText._ || '');
      }
      
      const pmcId = pubmedData?.ArticleIdList?.ArticleId?.find(id => id.IdType === 'pmc')?._;
      const doi = pubmedData?.ArticleIdList?.ArticleId?.find(id => id.IdType === 'doi')?._;

      return {
        pmid: medlineCitation.PMID,
        pmcid: pmcId,
        title: articleData.ArticleTitle || 'No Title Available',
        abstract,
        authors: authors.join(', '),
        journal: articleData.Journal?.Title || 'N/A',
        publicationYear: articleData.Journal?.JournalIssue?.PubDate?.Year || 'N/A',
        doi: doi
      };
    }).filter(article => article !== null);

    logger.info(`Formatted ${formattedArticles.length} articles`);
    
    return res.json({
      results: formattedArticles,
      total: totalCount
    });
    
  } catch (error) {
    logger.error(`Literature search error: ${error.message}`, { stack: error.stack, response: error.response?.data });
    return res.status(500).json({ 
      error: 'Error searching literature',
      details: error.message
    });
  }
});

// Get article details by PMID or PMCID, including full text if available via BioC
router.get('/pubmed/:id', async (req, res) => { // Changed endpoint to /pubmed/:id
  try {
    const { id } = req.params;
    const isPmcId = id.toUpperCase().startsWith('PMC');
    
    if (!id) {
      return res.status(400).json({ error: 'PubMed ID or PMC ID is required' });
    }
    
    logger.info(`Fetching details for ID: ${id}`);

    // 1. Fetch standard details from eFetch first
    let articleDetails = {};
    try {
        const fetchResponse = await axios.get(PUBMED_EFETCH_URL, {
          params: {
            db: 'pubmed',
            id: id,
            retmode: 'xml'
          }
        });
        
        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
        const result = await parser.parseStringPromise(fetchResponse.data);
        
        if (!result.PubmedArticleSet?.PubmedArticle) {
          throw new Error('Article not found via eFetch');
        }
        
        const article = result.PubmedArticleSet.PubmedArticle;
        const medlineCitation = article.MedlineCitation;
        const articleData = medlineCitation.Article;
        const pubmedData = article.PubmedData;

        let authors = [];
        if (articleData.AuthorList && articleData.AuthorList.Author) {
            const authorList = Array.isArray(articleData.AuthorList.Author) ? articleData.AuthorList.Author : [articleData.AuthorList.Author];
            authors = authorList.map(author => (
              author.LastName && author.ForeName ? `${author.LastName}, ${author.ForeName}` : author.LastName || author.CollectiveName || ''
            )).filter(Boolean);
        }
        
        let abstract = '';
        if (articleData.Abstract && articleData.Abstract.AbstractText) {
            abstract = Array.isArray(articleData.Abstract.AbstractText) 
            ? articleData.Abstract.AbstractText.map(t => typeof t === 'string' ? t : t._).join(' ') 
            : (typeof articleData.Abstract.AbstractText === 'string' ? articleData.Abstract.AbstractText : articleData.Abstract.AbstractText._ || '');
        }
        
        const pmcId = pubmedData?.ArticleIdList?.ArticleId?.find(id => id.IdType === 'pmc')?._;
        const doi = pubmedData?.ArticleIdList?.ArticleId?.find(id => id.IdType === 'doi')?._;
        const pmidActual = medlineCitation.PMID;

        articleDetails = {
          pmid: pmidActual,
          pmcid: pmcId,
          title: articleData.ArticleTitle || 'No Title Available',
          abstract,
          authors: authors.join(', '),
          journal: articleData.Journal?.Title || 'N/A',
          publicationYear: articleData.Journal?.JournalIssue?.PubDate?.Year || 'N/A',
          doi: doi,
          keywords: medlineCitation.KeywordList?.Keyword ? (Array.isArray(medlineCitation.KeywordList.Keyword) ? medlineCitation.KeywordList.Keyword : [medlineCitation.KeywordList.Keyword]).map(k => typeof k === 'string' ? k : k._) : [],
          meshTerms: medlineCitation.MeshHeadingList?.MeshHeading ? (Array.isArray(medlineCitation.MeshHeadingList.MeshHeading) ? medlineCitation.MeshHeadingList.MeshHeading : [medlineCitation.MeshHeadingList.MeshHeading]).map(term => term.DescriptorName?._ || term.DescriptorName) : [],
        };

    } catch (efetchError) {
      logger.error(`eFetch failed for ${id}: ${efetchError.message}`);
      // Continue to try BioC if possible
      if (!isPmcId && !articleDetails.pmcid) {
         // If we don't have a PMCID, we can't use BioC easily, return error
         return res.status(404).json({ error: 'Article details not found via eFetch and PMCID is unknown.' });
      }
    }

    // 2. Attempt to fetch full text from BioC using PMCID if available
    const idForBioC = isPmcId ? id : articleDetails.pmcid;
    let fullText = null;
    let sections = [];
    if (idForBioC) {
      try {
        logger.info(`Attempting to fetch BioC JSON for ID: ${idForBioC}`);
        const biocResponse = await axios.get(`${BIOC_PMC_URL}/${idForBioC}/unicode`);
        const biocData = biocResponse.data;
        
        // Extract passages (text sections)
        if (biocData && biocData.documents && biocData.documents.length > 0) {
          const document = biocData.documents[0];
          fullText = ''; // Concatenate all text for simple fullText field
          document.passages?.forEach(passage => {
            const sectionTitle = passage.infons?.section_type || 'Unknown Section';
            const text = passage.text || '';
            sections.push({ title: sectionTitle, text: text });
            fullText += text + '\n\n'; 
          });
          logger.info(`Successfully fetched and parsed BioC data for ${idForBioC}`);
        } else {
           logger.warn(`BioC data structure unexpected or empty for ${idForBioC}`);
        }
      } catch (biocError) {
        if (biocError.response?.status === 404) {
          logger.warn(`BioC full text not found for ID: ${idForBioC}`);
        } else {
          logger.error(`Error fetching BioC full text for ${idForBioC}: ${biocError.message}`);
        }
        // Full text is optional, so we continue without it
      }
    }

    // 3. Fetch related articles (remains the same)
    let relatedPmids = [];
    try {
      const relatedResponse = await axios.get(PUBMED_ELINK_URL, {
        params: {
          dbfrom: 'pubmed',
          db: 'pubmed',
          id: articleDetails.pmid || id, // Use fetched PMID if available
          cmd: 'neighbor_score',
          retmode: 'json'
        }
      });
      const linkSetDb = relatedResponse.data.linksets?.[0]?.linksetdbs?.find(
        db => db.linkname === 'pubmed_pubmed'
      );
      relatedPmids = linkSetDb ? linkSetDb.links?.slice(0, 5) || [] : [];
    } catch (e) {
      logger.error(`Error parsing related articles for ${id}: ${e.message}`);
    }
    
    // Combine all fetched data
    const finalDetails = {
      ...articleDetails,
      fullText: fullText?.trim() || null,
      sections: sections.length > 0 ? sections : null,
      relatedArticles: relatedPmids
    };

    // If we couldn't get basic details from eFetch but got BioC, fill from BioC if possible
    if (!articleDetails.title && fullText) {
        // Attempt basic extraction from BioC structure if needed (less reliable)
        const biocDoc = biocResponse?.data?.documents?.[0];
        articleDetails.title = biocDoc?.passages?.find(p => p.infons?.type === 'title')?.text || 'Title Not Found';
        // Add other extractions if necessary
    }
    
    return res.json(finalDetails);
    
  } catch (error) {
    logger.error(`Error fetching article details for ${req.params.id}: ${error.message}`, { stack: error.stack, response: error.response?.data });
    return res.status(500).json({ 
      error: 'Error fetching article details',
      details: error.message
    });
  }
});

// Analyze literature using Claude
router.post('/analyze', async (req, res) => {
  try {
    const { articles, query } = req.body; // articles can be PMIDs, abstracts, or full texts

    if (!articles || !Array.isArray(articles) || articles.length === 0 || !query) {
      return res.status(400).json({ error: 'Articles (list) and analysis query are required.' });
    }

    // Prepare context for Claude
    let context = "Analyze the following literature excerpts:\n\n";
    articles.forEach((article, index) => {
      context += `--- Article ${index + 1} ---\n`;
      if (typeof article === 'string') { // Assume it's abstract or text
        context += `${article.substring(0, 1500)}...\n`; // Limit context size
      } else if (article.abstract) {
        context += `Title: ${article.title}\nAbstract: ${article.abstract.substring(0, 1500)}...\n`;
      } else if (article.pmid) {
        context += `PMID: ${article.pmid}\nTitle: ${article.title || 'N/A'}\n`;
      }
      context += `\n`;
    });

    const userPrompt = `${query}\n\nBased on the provided literature context:\n${context}`; 

    // Call Claude via AI service
    const analysisResponse = await axios.post('http://localhost:5000/api/ai/ask', {
      question: query, // Keep the original query separate for clarity
      context: context // Provide the compiled context
    });

    res.json({ analysis: analysisResponse.data.response });

  } catch (error) {
    logger.error(`Error analyzing literature: ${error.message}`, { stack: error.stack });
    res.status(500).json({ 
      error: 'Error analyzing literature', 
      details: error.message 
    });
  }
});

module.exports = router; 