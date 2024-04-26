import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  makeStyles,
  Box,
  Link
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';
import { literatureAPI, claudeAPI } from '../services/api';
import Alert from '@material-ui/lab/Alert';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(4),
    fontWeight: 500,
  },
  paper: {
    padding: theme.spacing(3),
    height: '100%',
  },
  searchBar: {
    marginBottom: theme.spacing(3),
  },
  searchButton: {
    height: 56,
    marginLeft: theme.spacing(1),
  },
  articleItem: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      transform: 'translateX(5px)',
    },
  },
  articleTitle: {
    fontWeight: 500,
  },
  articleInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  abstractText: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  progress: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(4, 0),
  },
  iconSpacing: {
    marginRight: theme.spacing(1),
  },
  articleDetail: {
    padding: theme.spacing(3),
  },
  articleDetailTitle: {
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  citation: {
    fontStyle: 'italic',
    marginBottom: theme.spacing(2),
  },
  abstractTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(6),
  },
  emptyStateIcon: {
    fontSize: 64,
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(2),
  },
}));

const LiteratureExplorer = () => {
  const classes = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const articlesPerPage = 10;
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) {
        setError('Please enter a search query.');
        return;
    }
    
    setLoading(true);
    setSelectedArticle(null);
    setError(null);
    setAnalysisResult(null);
    setCurrentPage(page);
    
    try {
      const response = await literatureAPI.searchPubMed(searchQuery, { 
          limit: articlesPerPage, 
          page: page 
      }); 
      
      if (response.data && response.data.results) {
        setArticles(response.data.results);
        setTotalResults(response.data.total);
      } else {
        setArticles([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error('Error searching literature:', err);
      setError(err.response?.data?.error || 'Failed to search literature. Please try again later.');
      setArticles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleArticleSelect = async (article) => {
    setLoadingDetails(true);
    setError(null);
    setAnalysisResult(null);
    try {
        const response = await literatureAPI.getPubMedArticle(article.pmid); 
        setSelectedArticle(response.data); 
    } catch (err) {
        console.error('Error fetching article details:', err);
        setError(err.response?.data?.error || 'Failed to load article details.');
        setSelectedArticle(article);
    } finally {
        setLoadingDetails(false);
    }
  };

  const handleAnalyzeArticle = async () => {
      if (!selectedArticle) return;
      setAnalysisLoading(true);
      setAnalysisResult(null);
      setError(null);
      try {
          const context = selectedArticle.fullText || selectedArticle.abstract || '';
          const query = `Summarize the key findings and relevance to ADHD drug discovery from this article titled "${selectedArticle.title}".`;
          const response = await claudeAPI.askQuestion(query, context);
          setAnalysisResult(response.data.response);
      } catch (err) {
          console.error('Error analyzing article:', err);
          setError(err.response?.data?.error || 'Failed to analyze article.');
      } finally {
          setAnalysisLoading(false);
      }
  }
  
  const handleBackToResults = () => {
    setSelectedArticle(null);
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Literature Explorer
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.searchBar}>
              <Grid item xs>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search for research papers, patents, and clinical trials..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.searchButton}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
            
            {error && (
                <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>
            )}

            {loading ? (
              <div className={classes.progress}>
                <CircularProgress />
              </div>
            ) : selectedArticle ? (
              <div className={classes.articleDetail}>
                <Button color="primary" onClick={handleBackToResults}>
                  ← Back to results
                </Button>
                
                <Typography variant="h5" className={classes.articleDetailTitle}>
                  {selectedArticle.title}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>Authors: {selectedArticle.authors || 'N/A'}</Typography>
                <Typography variant="body2" className={classes.citation}>
                  {selectedArticle.journal || 'N/A'} ({selectedArticle.publicationYear || 'N/A'}) 
                  {selectedArticle.doi && (
                    <> | DOI: <Link href={`https://doi.org/${selectedArticle.doi}`} target="_blank" rel="noopener">{selectedArticle.doi}</Link></>
                  )}
                  {selectedArticle.pmid && ` | PMID: ${selectedArticle.pmid}`}
                  {selectedArticle.pmcid && ` | PMCID: ${selectedArticle.pmcid}`}
                </Typography>
                
                <Divider className={classes.divider} />
                
                {loadingDetails ? (
                    <CircularProgress />
                ) : (
                    <>
                        {selectedArticle.abstract && (
                            <>
                                <Typography variant="subtitle1" className={classes.abstractTitle}>
                                Abstract
                                </Typography>
                                <Typography variant="body1" paragraph>
                                <FormatQuoteIcon fontSize="small" className={classes.iconSpacing} />
                                {selectedArticle.abstract}
                                </Typography>
                            </>
                        )}

                        {selectedArticle.fullText && (
                            <>
                                <Typography variant="subtitle1" className={classes.abstractTitle}>
                                Full Text
                                </Typography>
                                <Paper variant="outlined" style={{ padding: 16, maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                                    <Typography variant="body2">{selectedArticle.fullText}</Typography>
                                </Paper>
                            </>
                        )}
                        
                        {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle1" className={classes.abstractTitle}>
                                Keywords
                                </Typography>
                                {selectedArticle.keywords.map((keyword, index) => (
                                <Chip key={index} label={keyword} className={classes.chip} variant="outlined" color="primary" size="small" />
                                ))}
                            </Box>
                        )}
                        
                        {selectedArticle.meshTerms && selectedArticle.meshTerms.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle1" className={classes.abstractTitle}>
                                MeSH Terms
                                </Typography>
                                {selectedArticle.meshTerms.map((term, index) => (
                                <Chip key={index} label={term} className={classes.chip} variant="outlined" size="small" />
                                ))}
                            </Box>
                        )}

                        <Divider className={classes.divider} />
                        
                        <Box mt={2} mb={2}>
                            <Button 
                                variant="contained" 
                                color="secondary" 
                                onClick={handleAnalyzeArticle}
                                disabled={analysisLoading}
                            >
                                {analysisLoading ? <CircularProgress size={24} /> : 'Analyze with AI'}
                            </Button>
                            {analysisResult && (
                                <Paper elevation={0} style={{ marginTop: 16, padding: 16, backgroundColor: '#e3f2fd' }}>
                                    <Typography variant="subtitle2" gutterBottom>AI Analysis:</Typography>
                                    <Typography variant="body2">{analysisResult}</Typography>
                                </Paper>
                            )}
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Button variant="outlined" color="primary" fullWidth>
                              Download PDF
                            </Button>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Button variant="outlined" color="primary" fullWidth>
                              Add to Reference Library
                            </Button>
                          </Grid>
                        </Grid>
                    </>
                )}
              </div>
            ) : articles.length > 0 ? (
              <List>
                {articles.map((article) => (
                  <Paper 
                    key={article.pmid}
                    className={classes.articleItem}
                    onClick={() => handleArticleSelect(article)}
                    elevation={1}
                  >
                    <Typography variant="h6" className={classes.articleTitle}>
                      {article.title}
                    </Typography>
                    
                    <div className={classes.articleInfo}>
                      <Typography variant="body2">
                        {article.authors}
                      </Typography>
                      <Typography variant="body2">
                        {article.journal} ({article.publicationYear})
                      </Typography>
                    </div>
                    
                    <Typography 
                      variant="body2" 
                      className={classes.abstractText}
                      style={{ 
                          maxHeight: '60px',
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' 
                      }}
                    >
                      {article.abstract}
                    </Typography>
                  </Paper>
                ))}
              </List>
            ) : (
              <div className={classes.emptyState}>
                <MenuBookIcon className={classes.emptyStateIcon} />
                <Typography variant="h6" color="textSecondary">
                  Search for literature
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enter keywords to search for research papers related to ADHD treatments
                </Typography>
              </div>
            )}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default LiteratureExplorer; 