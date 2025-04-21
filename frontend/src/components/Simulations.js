import React, { useState } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  makeStyles,
  Slider,
  Chip,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@material-ui/core';
import MemoryIcon from '@material-ui/icons/Memory';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import SubjectIcon from '@material-ui/icons/Subject';
import AiIcon from '@material-ui/icons/Psychology';
import SearchIcon from '@material-ui/icons/Search';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import axios from 'axios';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  formControl: {
    marginBottom: theme.spacing(2),
    minWidth: '100%',
  },
  button: {
    marginTop: theme.spacing(2),
  },
  simulationCard: {
    marginBottom: theme.spacing(2),
  },
  simulationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  tabs: {
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  simulationResults: {
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
  },
  chartPlaceholder: {
    height: 300,
    backgroundColor: '#eee',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
  },
  thinkingBlock: {
    backgroundColor: '#e3f2fd',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    whiteSpace: 'pre-wrap',
    maxHeight: '400px',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.9rem'
  },
  responseBlock: {
    backgroundColor: '#f5f5f5',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    whiteSpace: 'pre-wrap'
  },
  promptField: {
    marginBottom: theme.spacing(2)
  }
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Simulations() {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [simulationType, setSimulationType] = useState('docking');
  const [targetProtein, setTargetProtein] = useState('DAT');
  const [selectedMolecule, setSelectedMolecule] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState([]);
  const [parameters, setParameters] = useState({
    temperature: 310,
    simulationTime: 100,
    solventModel: 'explicit',
  });
  
  // Claude API states
  const [prompt, setPrompt] = useState('');
  const [claudeResponse, setClaudeResponse] = useState(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [claudeError, setClaudeError] = useState(null);
  const [claudeSettings, setClaudeSettings] = useState({
    apiKey: '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',
    model: 'claude-3-7-sonnet-20250219',
    temperature: 1,
    maxTokens: 20000,
    thinkingBudget: 16000
  });

  // ChEMBL API states
  const [chemblEntity, setChemblEntity] = useState('molecule');
  const [chemblQuery, setChemblQuery] = useState('');
  const [chemblFilterType, setChemblFilterType] = useState('contains');
  const [chemblFilterField, setChemblFilterField] = useState('pref_name');
  const [chemblResults, setChemblResults] = useState([]);
  const [chemblLoading, setChemblLoading] = useState(false);
  const [chemblError, setChemblError] = useState(null);
  const [chemblLimit, setChemblLimit] = useState(10);
  const [chemblPage, setChemblPage] = useState(1);
  const [chemblTotalCount, setChemblTotalCount] = useState(0);
  const [chemblSearchPerformed, setChemblSearchPerformed] = useState(false);
  const [selectedChemblItem, setSelectedChemblItem] = useState(null);
  
  // PubMed/BioC API states
  const [pubmedIdType, setPubmedIdType] = useState('pmid'); // pmid or pmcid
  const [pubmedId, setPubmedId] = useState('');
  const [pubmedFormat, setPubmedFormat] = useState('json'); // xml or json
  const [pubmedEncoding, setPubmedEncoding] = useState('unicode'); // unicode or ascii
  const [pubmedLoading, setPubmedLoading] = useState(false);
  const [pubmedError, setPubmedError] = useState(null);
  const [pubmedResult, setPubmedResult] = useState(null);
  const [pubmedArticleView, setPubmedArticleView] = useState('abstract'); // abstract, full, or raw

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleParameterChange = (name) => (event, newValue) => {
    setParameters({
      ...parameters,
      [name]: name === 'temperature' || name === 'simulationTime' ? newValue : event.target.value,
    });
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleClaudeSettingChange = (name) => (event) => {
    setClaudeSettings({
      ...claudeSettings,
      [name]: name === 'temperature' ? parseFloat(event.target.value) : 
               (name === 'maxTokens' || name === 'thinkingBudget') ? parseInt(event.target.value) : 
               event.target.value
    });
  };

  const callClaudeAPI = async () => {
    if (!prompt.trim()) {
      setClaudeError('Please enter a prompt');
      return;
    }

    setClaudeLoading(true);
    setClaudeError(null);

    try {
      const response = await axios({
        method: 'post',
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeSettings.apiKey,
          'anthropic-version': '2023-06-01'
        },
        data: {
          model: claudeSettings.model,
          max_tokens: claudeSettings.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: claudeSettings.temperature,
          thinking: {
            type: 'enabled',
            budget_tokens: claudeSettings.thinkingBudget
          }
        }
      });
      
      // Set the response data
      setClaudeResponse(response.data);
    } catch (error) {
      console.error('Error calling Claude API:', error);
      let errorMessage = 'Failed to call Claude API';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const responseData = error.response.data;
        errorMessage = responseData.error?.message || JSON.stringify(responseData) || 'API returned an error';
        console.error('API error response:', responseData);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from API - network issue';
        console.error('No API response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setClaudeError(errorMessage);
    } finally {
      setClaudeLoading(false);
    }
  };

  const runSimulation = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSimulationResults([
        {
          id: Date.now(),
          type: simulationType,
          molecule: selectedMolecule || 'Compound-A1',
          target: targetProtein,
          parameters: { ...parameters },
          results: {
            bindingAffinity: '-8.2 kcal/mol',
            interactionSites: ['ASP79', 'PHE326', 'TYR156'],
            stability: '87%',
          },
          date: new Date().toLocaleString(),
        },
        ...simulationResults
      ]);
    }, 3000);
  };

  const molecules = [
    { id: 'mol1', name: 'Compound-A1' },
    { id: 'mol2', name: 'Compound-A2' },
    { id: 'mol3', name: 'Amphetamine' },
    { id: 'mol4', name: 'Lisdexamfetamine' },
    { id: 'mol5', name: 'Methylphenidate' },
  ];

  const targets = [
    { id: 'DAT', name: 'Dopamine Transporter (DAT)' },
    { id: 'D1', name: 'Dopamine D1 Receptor' },
    { id: 'D2', name: 'Dopamine D2 Receptor' },
    { id: 'NET', name: 'Norepinephrine Transporter (NET)' },
  ];

  const simulationTypes = [
    { value: 'docking', label: 'Molecular Docking' },
    { value: 'md', label: 'Molecular Dynamics' },
    { value: 'admet', label: 'ADMET Prediction' },
  ];

  // ChEMBL API functions
  const getChemblFilterFields = () => {
    switch(chemblEntity) {
      case 'molecule':
        return [
          { value: 'pref_name', label: 'Preferred Name' },
          { value: 'molecule_chembl_id', label: 'ChEMBL ID' },
          { value: 'molecule_structures__canonical_smiles', label: 'SMILES' },
          { value: 'molecule_properties__alogp', label: 'ALogP' },
          { value: 'molecule_properties__full_mwt', label: 'Molecular Weight' },
          { value: 'molecule_properties__full_molformula', label: 'Molecular Formula' }
        ];
      case 'target':
        return [
          { value: 'pref_name', label: 'Preferred Name' },
          { value: 'target_chembl_id', label: 'ChEMBL ID' },
          { value: 'target_type', label: 'Target Type' },
          { value: 'organism', label: 'Organism' }
        ];
      case 'assay':
        return [
          { value: 'assay_chembl_id', label: 'ChEMBL ID' },
          { value: 'description', label: 'Description' },
          { value: 'assay_type', label: 'Assay Type' }
        ];
      case 'activity':
        return [
          { value: 'activity_id', label: 'Activity ID' },
          { value: 'standard_type', label: 'Standard Type' },
          { value: 'pchembl_value', label: 'pChEMBL Value' }
        ];
      case 'drug':
        return [
          { value: 'pref_name', label: 'Preferred Name' },
          { value: 'molecule_chembl_id', label: 'ChEMBL ID' },
          { value: 'development_phase', label: 'Development Phase' }
        ];
      case 'mechanism':
        return [
          { value: 'mechanism_of_action', label: 'Mechanism of Action' },
          { value: 'action_type', label: 'Action Type' }
        ];
      default:
        return [];
    }
  };

  const searchChembl = async () => {
    if (!chemblQuery.trim() || chemblEntity === '') {
      setChemblError('Please enter a search query and select an entity type');
      return;
    }

    setChemblLoading(true);
    setChemblError(null);
    setChemblSearchPerformed(true);
    setSelectedChemblItem(null);
    
    try {
      const offset = (chemblPage - 1) * chemblLimit;
      let url = `https://www.ebi.ac.uk/chembl/api/data/${chemblEntity}.json?limit=${chemblLimit}&offset=${offset}`;
      
      // Add filter if a field and query are specified
      if (chemblFilterField && chemblQuery) {
        // For filtering with specific operators like contains, exact, etc.
        url += `&${chemblFilterField}__${chemblFilterType}=${encodeURIComponent(chemblQuery)}`;
      }
      
      console.log('ChEMBL API URL:', url);
      
      const response = await axios.get(url);
      
      console.log('ChEMBL API Response:', response.data);
      
      setChemblResults(response.data.molecules || response.data.targets || 
                      response.data.assays || response.data.activities ||
                      response.data.drugs || response.data.mechanisms || 
                      response.data);
      
      setChemblTotalCount(response.data.page_meta?.total_count || 0);
      
      if (response.data.page_meta?.total_count === 0) {
        setChemblError('No results found. Try a different search query.');
      }
    } catch (error) {
      console.error('Error searching ChEMBL:', error);
      let errorMessage = 'Failed to search ChEMBL database';
      
      if (error.response) {
        errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
        console.error('API error response:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response received from ChEMBL API - network issue';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setChemblError(errorMessage);
    } finally {
      setChemblLoading(false);
    }
  };
  
  const renderChemblResults = () => {
    if (!chemblResults || chemblResults.length === 0) {
      return (
        <Typography style={{ padding: 16 }}>
          No results found
        </Typography>
      );
    }
    
    switch(chemblEntity) {
      case 'molecule':
        return (
          <div>
            {chemblResults.map((mol, index) => (
              <Card key={index} style={{ margin: 8 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      {mol.molecule_structures?.molfile && (
                        <img 
                          src={`https://www.ebi.ac.uk/chembl/api/data/image/${mol.molecule_chembl_id}?format=svg`} 
                          alt="Molecule structure"
                          style={{ maxWidth: '100%', height: 120 }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6">
                        {mol.pref_name || 'Unnamed compound'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>ChEMBL ID:</strong> {mol.molecule_chembl_id}
                      </Typography>
                      {mol.molecule_properties?.full_molformula && (
                        <Typography variant="body2">
                          <strong>Formula:</strong> {mol.molecule_properties.full_molformula}
                        </Typography>
                      )}
                      {mol.molecule_properties?.full_mwt && (
                        <Typography variant="body2">
                          <strong>Mol Weight:</strong> {mol.molecule_properties.full_mwt.toFixed(2)}
                        </Typography>
                      )}
                      <Button 
                        size="small" 
                        color="primary" 
                        style={{ marginTop: 8 }}
                        onClick={() => setSelectedChemblItem(mol)}
                      >
                        View Details
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      
      case 'target':
        return (
          <div>
            {chemblResults.map((target, index) => (
              <Card key={index} style={{ margin: 8 }}>
                <CardContent>
                  <Typography variant="h6">
                    {target.pref_name || 'Unnamed target'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>ChEMBL ID:</strong> {target.target_chembl_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {target.target_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Organism:</strong> {target.organism}
                  </Typography>
                  <Button 
                    size="small" 
                    color="primary" 
                    style={{ marginTop: 8 }}
                    onClick={() => setSelectedChemblItem(target)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      
      case 'assay':
        return (
          <div>
            {chemblResults.map((assay, index) => (
              <Card key={index} style={{ margin: 8 }}>
                <CardContent>
                  <Typography variant="h6">
                    {assay.assay_chembl_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong> {assay.description || 'No description'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {assay.assay_type}
                  </Typography>
                  <Button 
                    size="small" 
                    color="primary" 
                    style={{ marginTop: 8 }}
                    onClick={() => setSelectedChemblItem(assay)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );
        
      default:
        return (
          <div style={{ padding: 16 }}>
            <pre style={{ overflowX: 'auto' }}>
              {JSON.stringify(chemblResults, null, 2)}
            </pre>
            <Button 
              variant="outlined" 
              color="primary" 
              style={{ marginTop: 8 }}
              onClick={() => setSelectedChemblItem(chemblResults[0])}
            >
              View First Item Details
            </Button>
          </div>
        );
    }
  };

  // Watch for page changes and re-fetch results
  React.useEffect(() => {
    if (chemblSearchPerformed && chemblQuery.trim() && chemblEntity) {
      searchChembl();
    }
  }, [chemblPage]);

  // Watch for entity changes and update the filter field accordingly
  React.useEffect(() => {
    const fields = getChemblFilterFields();
    if (fields.length > 0) {
      setChemblFilterField(fields[0].value);
    }
  }, [chemblEntity]);

  // PubMed/BioC API functions
  const fetchPubmedArticle = async () => {
    if (!pubmedId.trim()) {
      setPubmedError('Please enter a PubMed ID or PMC ID');
      return;
    }

    setPubmedLoading(true);
    setPubmedError(null);
    setPubmedResult(null);
    
    try {
      // Construct the URL based on user selections
      let id = pubmedId.trim();
      if (pubmedIdType === 'pmcid' && !id.startsWith('PMC')) {
        id = `PMC${id}`;
      }
      
      const url = `https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_${pubmedFormat}/${id}/${pubmedEncoding}`;
      
      console.log('PubMed/BioC API URL:', url);
      
      const response = await axios.get(url);
      
      console.log('PubMed/BioC API Response:', response.data);
      
      setPubmedResult(response.data);
    } catch (error) {
      console.error('Error fetching PubMed/BioC article:', error);
      let errorMessage = 'Failed to fetch article';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `Article not found. Please check the ${pubmedIdType === 'pmid' ? 'PubMed' : 'PMC'} ID and make sure it's in the Open Access subset.`;
        } else {
          errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
        }
        console.error('API error response:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response received from PubMed/BioC API - network issue';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setPubmedError(errorMessage);
    } finally {
      setPubmedLoading(false);
    }
  };
  
  const renderPubmedArticle = () => {
    if (!pubmedResult) {
      return (
        <Typography style={{ padding: 16 }}>
          No article loaded
        </Typography>
      );
    }
    
    try {
      // Parse the article based on format
      if (pubmedFormat === 'json') {
        // Extract information from JSON response
        const document = pubmedResult.documents?.[0];
        if (!document) {
          return <Typography>Unable to parse article data</Typography>;
        }
        
        // Extract passages
        const passages = document.passages || [];
        const infons = document.infons || {};
        
        // Extract article metadata
        const articleTitle = passages.find(p => p.infons?.section_type === 'TITLE')?.text || 'Untitled';
        const abstractPassages = passages.filter(p => p.infons?.section_type === 'ABSTRACT');
        const bodyPassages = passages.filter(p => 
          p.infons?.section_type && 
          !['TITLE', 'ABSTRACT', 'REF'].includes(p.infons.section_type)
        );
        
        // Article metadata
        const journal = infons.journal || '';
        const year = infons.year || '';
        const authors = infons.authors?.split(', ') || [];
        const pmid = infons.pmid || pubmedId;
        const pmcid = infons.pmcid || (pubmedIdType === 'pmcid' ? pubmedId : '');
        
        // Render based on selected view
        if (pubmedArticleView === 'raw') {
          return (
            <pre style={{ overflowX: 'auto', maxHeight: 600, padding: 16 }}>
              {JSON.stringify(pubmedResult, null, 2)}
            </pre>
          );
        } else if (pubmedArticleView === 'abstract') {
          return (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {articleTitle}
                </Typography>
                
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {authors.join(', ')}
                </Typography>
                
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {journal} {year && `(${year})`}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  {pmid && `PMID: ${pmid}`} {pmcid && ` | PMCID: ${pmcid}`}
                </Typography>
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Typography variant="h6" gutterBottom>
                  Abstract
                </Typography>
                
                {abstractPassages.map((passage, index) => (
                  <Typography key={index} paragraph>
                    {passage.text}
                  </Typography>
                ))}
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => setPubmedArticleView('full')}
                  style={{ marginTop: 16 }}
                >
                  View Full Text
                </Button>
              </CardContent>
            </Card>
          );
        } else if (pubmedArticleView === 'full') {
          return (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {articleTitle}
                </Typography>
                
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {authors.join(', ')}
                </Typography>
                
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {journal} {year && `(${year})`}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  {pmid && `PMID: ${pmid}`} {pmcid && ` | PMCID: ${pmcid}`}
                </Typography>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0' }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setPubmedArticleView('abstract')}
                  >
                    Show Abstract Only
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPubmedArticleView('raw')}
                  >
                    View Raw Data
                  </Button>
                </div>
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Typography variant="h6" gutterBottom>
                  Abstract
                </Typography>
                
                {abstractPassages.map((passage, index) => (
                  <Typography key={`abstract-${index}`} paragraph>
                    {passage.text}
                  </Typography>
                ))}
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Typography variant="h6" gutterBottom>
                  Full Text
                </Typography>
                
                {bodyPassages.map((passage, index) => (
                  <div key={`body-${index}`} style={{ marginBottom: 16 }}>
                    {passage.infons?.section_type && passage.infons?.section_type !== 'BODY' && (
                      <Typography variant="subtitle1" gutterBottom>
                        {passage.infons.section_type.toLowerCase().replace(/_/g, ' ')}
                      </Typography>
                    )}
                    <Typography paragraph>
                      {passage.text}
                    </Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        }
      } else {
        // XML format - show raw data with option to parse
        return (
          <div>
            <Typography variant="subtitle1" gutterBottom>
              XML Response (Raw)
            </Typography>
            <pre style={{ overflowX: 'auto', maxHeight: 600, padding: 16 }}>
              {pubmedResult}
            </pre>
          </div>
        );
      }
    } catch (error) {
      console.error('Error rendering PubMed article:', error);
      return (
        <Typography color="error">
          Error parsing article data: {error.message}
        </Typography>
      );
    }
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Simulations
      </Typography>
      
      <Paper className={classes.paper}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          className={classes.tabs}
        >
          <Tab icon={<MemoryIcon />} label="Run Simulation" />
          <Tab icon={<ShowChartIcon />} label="Results Analysis" />
          <Tab icon={<SubjectIcon />} label="Simulation History" />
          <Tab icon={<AiIcon />} label="Claude API" />
          <Tab icon={<SearchIcon />} label="ChEMBL DB" />
          <Tab icon={<LibraryBooksIcon />} label="PubMed/BioC" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Simulation Parameters
              </Typography>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Simulation Type</InputLabel>
                <Select
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value)}
                  label="Simulation Type"
                >
                  {simulationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Target Protein</InputLabel>
                <Select
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  label="Target Protein"
                >
                  {targets.map((target) => (
                    <MenuItem key={target.id} value={target.id}>
                      {target.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Molecule</InputLabel>
                <Select
                  value={selectedMolecule}
                  onChange={(e) => setSelectedMolecule(e.target.value)}
                  label="Molecule"
                >
                  <MenuItem value=""><em>Select a molecule</em></MenuItem>
                  {molecules.map((molecule) => (
                    <MenuItem key={molecule.id} value={molecule.id}>
                      {molecule.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography id="temperature-slider" gutterBottom>
                Temperature (K): {parameters.temperature}
              </Typography>
              <Slider
                value={parameters.temperature}
                onChange={handleParameterChange('temperature')}
                aria-labelledby="temperature-slider"
                min={270}
                max={350}
                step={1}
                marks={[
                  { value: 270, label: '270K' },
                  { value: 310, label: '310K' },
                  { value: 350, label: '350K' },
                ]}
              />
              
              <Typography id="simulation-time-slider" gutterBottom>
                Simulation Time (ns): {parameters.simulationTime}
              </Typography>
              <Slider
                value={parameters.simulationTime}
                onChange={handleParameterChange('simulationTime')}
                aria-labelledby="simulation-time-slider"
                min={10}
                max={500}
                step={10}
                marks={[
                  { value: 10, label: '10ns' },
                  { value: 250, label: '250ns' },
                  { value: 500, label: '500ns' },
                ]}
              />
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Solvent Model</InputLabel>
                <Select
                  value={parameters.solventModel}
                  onChange={handleParameterChange('solventModel')}
                  label="Solvent Model"
                >
                  <MenuItem value="explicit">Explicit Solvent</MenuItem>
                  <MenuItem value="implicit">Implicit Solvent</MenuItem>
                  <MenuItem value="vacuum">Vacuum</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={runSimulation}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Run Simulation'}
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Simulation Preview
              </Typography>
              
              <div className={classes.chartPlaceholder}>
                {loading ? (
                  <div style={{ textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography style={{ marginTop: 16 }}>
                      Running simulation...
                    </Typography>
                  </div>
                ) : (
                  <Typography>
                    [Molecular Visualization Placeholder]
                  </Typography>
                )}
              </div>
              
              {simulationResults.length > 0 && (
                <div className={classes.simulationResults}>
                  <Typography variant="h6" gutterBottom>
                    Latest Result
                  </Typography>
                  <Typography variant="body2">
                    <strong>Binding Affinity:</strong> {simulationResults[0].results.bindingAffinity}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Interaction Sites:</strong>{' '}
                    {simulationResults[0].results.interactionSites.map((site) => (
                      <Chip
                        key={site}
                        label={site}
                        className={classes.chip}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stability:</strong> {simulationResults[0].results.stability}
                  </Typography>
                </div>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Results Analysis
          </Typography>
          <div className={classes.chartPlaceholder}>
            <Typography>
              [Data Visualization Charts Placeholder]
            </Typography>
          </div>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Simulation History
          </Typography>
          
          {simulationResults.length > 0 ? (
            simulationResults.map((simulation) => (
              <Card key={simulation.id} className={classes.simulationCard}>
                <CardContent>
                  <div className={classes.simulationHeader}>
                    <Typography variant="h6">
                      {simulation.molecule} ({simulation.type})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {simulation.date}
                    </Typography>
                  </div>
                  
                  <Divider />
                  
                  <Grid container spacing={2} style={{ marginTop: 16 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Target:</strong> {simulation.target}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Temperature:</strong> {simulation.parameters.temperature}K
                      </Typography>
                      <Typography variant="body2">
                        <strong>Simulation Time:</strong> {simulation.parameters.simulationTime}ns
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Binding Affinity:</strong> {simulation.results.bindingAffinity}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Stability:</strong> {simulation.results.stability}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography>
              No simulation results available. Run a simulation to see results here.
            </Typography>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Claude API Integration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Claude API Settings
              </Typography>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={claudeSettings.model}
                  onChange={(e) => setClaudeSettings({...claudeSettings, model: e.target.value})}
                  label="Model"
                  disabled
                >
                  <MenuItem value="claude-3-7-sonnet-20250219">
                    claude-3-7-sonnet-20250219
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Typography gutterBottom>
                Temperature: {claudeSettings.temperature}
              </Typography>
              <Slider
                value={claudeSettings.temperature}
                onChange={(e, newValue) => setClaudeSettings({...claudeSettings, temperature: newValue})}
                min={0}
                max={1}
                step={0.01}
                marks={[
                  { value: 0, label: '0' },
                  { value: 0.5, label: '0.5' },
                  { value: 1, label: '1' },
                ]}
                disabled
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Max Tokens"
                    type="number"
                    variant="outlined"
                    fullWidth
                    value={claudeSettings.maxTokens}
                    onChange={(e) => setClaudeSettings({...claudeSettings, maxTokens: parseInt(e.target.value)})}
                    disabled
                    className={classes.formControl}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Thinking Budget"
                    type="number"
                    variant="outlined"
                    fullWidth
                    value={claudeSettings.thinkingBudget}
                    onChange={(e) => setClaudeSettings({...claudeSettings, thinkingBudget: parseInt(e.target.value)})}
                    disabled
                    className={classes.formControl}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom style={{ marginTop: 16 }}>
                Your Prompt
              </Typography>
              
              <TextField
                label="Enter your prompt"
                multiline
                rows={6}
                variant="outlined"
                fullWidth
                value={prompt}
                onChange={handlePromptChange}
                className={classes.promptField}
              />
              
              <Button
                variant="contained"
                color="primary"
                onClick={callClaudeAPI}
                disabled={claudeLoading || !prompt.trim()}
                fullWidth
                className={classes.button}
              >
                {claudeLoading ? <CircularProgress size={24} /> : 'Generate with Claude'}
              </Button>
              
              {claudeError && (
                <Typography color="error" style={{ marginTop: 8 }}>
                  {claudeError}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Claude Response
              </Typography>
              
              {claudeLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <CircularProgress />
                  <Typography style={{ marginTop: 16 }}>
                    Generating response...
                  </Typography>
                </div>
              ) : claudeResponse ? (
                <div>
                  {claudeResponse.content.map((block, index) => (
                    <div key={index}>
                      {block.type === 'thinking' && (
                        <div className={classes.thinkingBlock}>
                          <Typography variant="subtitle2" gutterBottom>
                            Claude's Thinking:
                          </Typography>
                          {block.thinking}
                        </div>
                      )}
                      {block.type === 'text' && (
                        <div className={classes.responseBlock}>
                          <Typography variant="subtitle2" gutterBottom>
                            Claude's Response:
                          </Typography>
                          {block.text}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                    Model: {claudeResponse.model}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tokens: {claudeResponse.usage.input_tokens} input, {claudeResponse.usage.output_tokens} output
                  </Typography>
                </div>
              ) : (
                <div className={classes.chartPlaceholder}>
                  <Typography color="textSecondary">
                    Enter a prompt and click "Generate with Claude" to see the response here
                  </Typography>
                </div>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* New ChEMBL API tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            ChEMBL Database Integration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Search Parameters
              </Typography>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={chemblEntity}
                  onChange={(e) => setChemblEntity(e.target.value)}
                  label="Entity Type"
                >
                  <MenuItem value="molecule">Molecules</MenuItem>
                  <MenuItem value="target">Targets</MenuItem>
                  <MenuItem value="assay">Assays</MenuItem>
                  <MenuItem value="activity">Activities</MenuItem>
                  <MenuItem value="drug">Drugs</MenuItem>
                  <MenuItem value="mechanism">Mechanisms</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Search Query"
                variant="outlined"
                fullWidth
                value={chemblQuery}
                onChange={(e) => setChemblQuery(e.target.value)}
                className={classes.formControl}
                helperText="Search molecules by name, SMILES, InChI, etc."
              />
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Filter Type</InputLabel>
                <Select
                  value={chemblFilterType}
                  onChange={(e) => setChemblFilterType(e.target.value)}
                  label="Filter Type"
                >
                  <MenuItem value="exact">exact</MenuItem>
                  <MenuItem value="iexact">iexact</MenuItem>
                  <MenuItem value="contains">contains</MenuItem>
                  <MenuItem value="icontains">icontains</MenuItem>
                  <MenuItem value="gt">gt (greater than)</MenuItem>
                  <MenuItem value="gte">gte (greater than or equal)</MenuItem>
                  <MenuItem value="lt">lt (less than)</MenuItem>
                  <MenuItem value="lte">lte (less than or equal)</MenuItem>
                  <MenuItem value="startswith">startswith</MenuItem>
                  <MenuItem value="istartswith">istartswith</MenuItem>
                  <MenuItem value="endswith">endswith</MenuItem>
                  <MenuItem value="iendswith">iendswith</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Filter Field</InputLabel>
                <Select
                  value={chemblFilterField}
                  onChange={(e) => setChemblFilterField(e.target.value)}
                  label="Filter Field"
                  disabled={chemblEntity === ''}
                >
                  {getChemblFilterFields().map(field => (
                    <MenuItem key={field.value} value={field.value}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Limit Results</InputLabel>
                <Select
                  value={chemblLimit}
                  onChange={(e) => setChemblLimit(e.target.value)}
                  label="Limit Results"
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                onClick={searchChembl}
                disabled={chemblLoading || !chemblQuery.trim() || chemblEntity === ''}
                fullWidth
                className={classes.button}
              >
                {chemblLoading ? <CircularProgress size={24} /> : 'Search ChEMBL'}
              </Button>
              
              {chemblError && (
                <Typography color="error" style={{ marginTop: 8 }}>
                  {chemblError}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom>
                Search Results
              </Typography>
              
              {chemblLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <CircularProgress />
                  <Typography style={{ marginTop: 16 }}>
                    Searching ChEMBL database...
                  </Typography>
                </div>
              ) : chemblResults.length > 0 ? (
                <div>
                  <Typography variant="body2" gutterBottom>
                    Found {chemblTotalCount} results (showing {chemblResults.length})
                  </Typography>
                  
                  <Paper style={{ maxHeight: 600, overflow: 'auto' }}>
                    {renderChemblResults()}
                  </Paper>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                    <Button 
                      variant="outlined" 
                      disabled={chemblPage === 1 || chemblLoading}
                      onClick={() => setChemblPage(prev => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    
                    <Typography variant="body2" style={{ marginTop: 8 }}>
                      Page {chemblPage} of {Math.ceil(chemblTotalCount / chemblLimit)}
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      disabled={chemblPage >= Math.ceil(chemblTotalCount / chemblLimit) || chemblLoading}
                      onClick={() => setChemblPage(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : !chemblLoading && chemblSearchPerformed ? (
                <Paper style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
                  <Typography>
                    No results found. Try changing your search query or filters.
                  </Typography>
                </Paper>
              ) : (
                <Paper style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
                  <Typography>
                    Enter a search query and click "Search ChEMBL" to see results here.
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                    The ChEMBL Database contains information on drug-like bioactive compounds, their targets, and activities.
                  </Typography>
                </Paper>
              )}
              
              {selectedChemblItem && (
                <Paper style={{ padding: 16, marginTop: 16 }}>
                  <Typography variant="h6" gutterBottom>
                    Selected Item Details
                  </Typography>
                  <pre style={{ overflowX: 'auto', maxHeight: 300 }}>
                    {JSON.stringify(selectedChemblItem, null, 2)}
                  </pre>
                  {chemblEntity === 'molecule' && selectedChemblItem.molecule_structures?.molfile && (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                      <img 
                        src={`https://www.ebi.ac.uk/chembl/api/data/image/${selectedChemblItem.molecule_chembl_id}?format=svg`} 
                        alt="Molecule structure"
                        style={{ maxWidth: '100%', maxHeight: 300 }}
                      />
                      <Typography variant="body2" style={{ marginTop: 8 }}>
                        {selectedChemblItem.pref_name || selectedChemblItem.molecule_chembl_id}
                      </Typography>
                    </div>
                  )}
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            PubMed/BioC Integration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Article Retrieval
              </Typography>
              
              <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend">ID Type</FormLabel>
                <RadioGroup 
                  row 
                  value={pubmedIdType} 
                  onChange={(e) => setPubmedIdType(e.target.value)}
                >
                  <FormControlLabel value="pmid" control={<Radio />} label="PubMed ID" />
                  <FormControlLabel value="pmcid" control={<Radio />} label="PMC ID" />
                </RadioGroup>
              </FormControl>
              
              <TextField
                label={`Enter ${pubmedIdType === 'pmid' ? 'PubMed' : 'PMC'} ID`}
                variant="outlined"
                fullWidth
                value={pubmedId}
                onChange={(e) => setPubmedId(e.target.value)}
                className={classes.formControl}
                helperText={`e.g. ${pubmedIdType === 'pmid' ? '17299597' : 'PMC1790863'}`}
              />
              
              <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend">Response Format</FormLabel>
                <RadioGroup 
                  row 
                  value={pubmedFormat} 
                  onChange={(e) => setPubmedFormat(e.target.value)}
                >
                  <FormControlLabel value="json" control={<Radio />} label="JSON" />
                  <FormControlLabel value="xml" control={<Radio />} label="XML" />
                </RadioGroup>
              </FormControl>
              
              <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend">Encoding</FormLabel>
                <RadioGroup 
                  row 
                  value={pubmedEncoding} 
                  onChange={(e) => setPubmedEncoding(e.target.value)}
                >
                  <FormControlLabel value="unicode" control={<Radio />} label="Unicode" />
                  <FormControlLabel value="ascii" control={<Radio />} label="ASCII" />
                </RadioGroup>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                onClick={fetchPubmedArticle}
                disabled={pubmedLoading || !pubmedId.trim()}
                fullWidth
                className={classes.button}
              >
                {pubmedLoading ? <CircularProgress size={24} /> : 'Fetch Article'}
              </Button>
              
              {pubmedError && (
                <Typography color="error" style={{ marginTop: 8 }}>
                  {pubmedError}
                </Typography>
              )}
              
              <div style={{ marginTop: 16 }}>
                <Typography variant="subtitle2" gutterBottom>
                  About BioC API for PMC Open Access
                </Typography>
                <Typography variant="body2">
                  This service provides access to PubMed Central Open Access articles in BioC format.
                </Typography>
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  Note that not all PubMed articles are available in this collection.
                </Typography>
                <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                  <a href="https://www.ncbi.nlm.nih.gov/research/bionlp/APIs/BioC-PMC/" target="_blank" rel="noopener noreferrer">
                    Learn more about BioC API
                  </a>
                </Typography>
              </div>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom>
                Article Content
              </Typography>
              
              {pubmedLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <CircularProgress />
                  <Typography style={{ marginTop: 16 }}>
                    Fetching article...
                  </Typography>
                </div>
              ) : pubmedResult ? (
                <Paper style={{ maxHeight: 700, overflow: 'auto', padding: 16 }}>
                  {renderPubmedArticle()}
                </Paper>
              ) : (
                <Paper style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
                  <Typography>
                    Enter a {pubmedIdType === 'pmid' ? 'PubMed' : 'PMC'} ID and click "Fetch Article" to see the article content.
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                    Example IDs: PubMed ID: 17299597, PMC ID: PMC1790863
                  </Typography>
                </Paper>
              )}
              
              {pubmedResult && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setPubmedArticleView('abstract')}
                    disabled={pubmedArticleView === 'abstract'}
                  >
                    Abstract View
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setPubmedArticleView('full')}
                    disabled={pubmedArticleView === 'full'}
                  >
                    Full Text View
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setPubmedArticleView('raw')}
                    disabled={pubmedArticleView === 'raw'}
                  >
                    Raw Data View
                  </Button>
                </div>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </div>
  );
}

export default Simulations; 