import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  makeStyles
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import AssessmentIcon from '@material-ui/icons/Assessment';

// This would be imported from a third-party library in a real implementation
const MoleculeViewer = ({ smiles, height = 300 }) => {
  const viewerRef = useRef(null);
  
  useEffect(() => {
    if (smiles && viewerRef.current) {
      // In a real implementation, this would initialize 3Dmol.js
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = `${height}px`;
      placeholder.style.backgroundColor = '#f5f5f5';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      
      const text = document.createElement('div');
      text.innerHTML = `<strong>SMILES:</strong> ${smiles}<br><br>3D Molecule Viewer would render here`;
      text.style.textAlign = 'center';
      text.style.padding = '20px';
      
      placeholder.appendChild(text);
      
      viewerRef.current.innerHTML = '';
      viewerRef.current.appendChild(placeholder);
    }
  }, [smiles, height]);
  
  return <div ref={viewerRef} style={{ width: '100%', height: `${height}px`, border: '1px solid #e0e0e0' }}></div>;
};

// Mock chart component for binding affinities
const BindingAffinityChart = ({ data }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (data && chartRef.current) {
      // In a real implementation, this would initialize a Plotly or D3 chart
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '300px';
      placeholder.style.backgroundColor = '#f5f5f5';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      
      const text = document.createElement('div');
      let chartData = '<strong>Receptor Binding Affinities</strong><br><br>';
      Object.entries(data).forEach(([receptor, value]) => {
        chartData += `${receptor}: ${value.score} (${value.classification})<br>`;
      });
      
      text.innerHTML = chartData;
      text.style.textAlign = 'center';
      text.style.padding = '20px';
      
      placeholder.appendChild(text);
      
      chartRef.current.innerHTML = '';
      chartRef.current.appendChild(placeholder);
    }
  }, [data]);
  
  return <div ref={chartRef} style={{ width: '100%', height: '300px', border: '1px solid #e0e0e0' }}></div>;
};

// Mock chart component for ADMET properties
const AdmetPropertiesChart = ({ data }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (data && chartRef.current) {
      // In a real implementation, this would initialize a Plotly or D3 chart
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '300px';
      placeholder.style.backgroundColor = '#f5f5f5';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.flexDirection = 'column';
      
      const text = document.createElement('div');
      text.innerHTML = '<strong>ADMET Properties Visualization</strong><br><br>Radar chart showing Absorption, Distribution, Metabolism, Excretion, and Toxicity properties would render here';
      text.style.textAlign = 'center';
      text.style.padding = '20px';
      
      const details = document.createElement('div');
      details.style.fontSize = '0.8rem';
      details.style.textAlign = 'left';
      details.style.maxWidth = '80%';
      
      let detailsText = '';
      if (data.absorption) {
        detailsText += `<strong>Absorption:</strong> Oral: ${data.absorption.oral.classification}, BBB: ${data.absorption.bbb.classification}<br>`;
      }
      if (data.distribution) {
        detailsText += `<strong>Distribution:</strong> Plasma Protein Binding: ${data.distribution.plasmaProteinBinding.percent}%<br>`;
      }
      if (data.metabolism) {
        detailsText += `<strong>Metabolism:</strong> Half-life: ${data.metabolism.halfLife.hours} hours<br>`;
      }
      if (data.toxicity) {
        detailsText += `<strong>Toxicity:</strong> Hepatotoxicity: ${data.toxicity.hepatotoxicity.risk}, Cardiotoxicity: ${data.toxicity.cardiotoxicity.risk}<br>`;
      }
      
      details.innerHTML = detailsText;
      
      placeholder.appendChild(text);
      placeholder.appendChild(details);
      
      chartRef.current.innerHTML = '';
      chartRef.current.appendChild(placeholder);
    }
  }, [data]);
  
  return <div ref={chartRef} style={{ width: '100%', height: '300px', border: '1px solid #e0e0e0' }}></div>;
};

// TabPanel component for tabbed interface
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
  formContainer: {
    marginBottom: theme.spacing(3),
  },
  formControl: {
    minWidth: '100%',
    marginBottom: theme.spacing(2),
  },
  buttonWrapper: {
    position: 'relative',
    marginTop: theme.spacing(2),
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
  },
  tabs: {
    marginBottom: theme.spacing(2),
  },
  resultsContainer: {
    marginTop: theme.spacing(3),
  },
  propertyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  propertyLabel: {
    fontWeight: 500,
  },
  alertMargin: {
    marginBottom: theme.spacing(2),
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

const SimulationPanel = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [simulationType, setSimulationType] = useState('binding');
  const [smiles, setSmiles] = useState('');
  const [simulationResults, setSimulationResults] = useState(null);
  const [error, setError] = useState(null);
  
  const molecules = [
    { id: 1, name: 'Methylphenidate', smiles: 'CN(C)C(C1=CC=CC=C1)C(C)OC(=O)C' },
    { id: 2, name: 'Amphetamine', smiles: 'CC(N)CC1=CC=CC=C1' },
    { id: 3, name: 'Atomoxetine', smiles: 'CC(C)NCC1=CC=CC(OC2=CC=CC=C2)=C1' },
    { id: 4, name: 'Novel Amphetamine Derivative', smiles: 'CC(CC1=CC=C(C=C1)O)NC' }
  ];
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSimulationTypeChange = (event) => {
    setSimulationType(event.target.value);
  };
  
  const handleSmilesChange = (event) => {
    setSmiles(event.target.value);
  };
  
  const handleRunSimulation = async () => {
    if (!smiles) {
      setError('Please select or enter a molecule SMILES notation');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call to the backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample simulation results based on simulation type
      if (simulationType === 'binding') {
        setSimulationResults({
          type: 'binding',
          moleculeName: molecules.find(m => m.smiles === smiles)?.name || 'Custom Molecule',
          smiles: smiles,
          bindingAffinities: {
            'Dopamine Transporter': { score: 84, classification: 'Strong' },
            'Norepinephrine Transporter': { score: 72, classification: 'Moderate' },
            'Serotonin Transporter': { score: 35, classification: 'Weak' },
            'D1 Receptor': { score: 22, classification: 'Weak' },
            'D2 Receptor': { score: 45, classification: 'Moderate' }
          },
          properties: {
            molecularWeight: 165.23,
            logP: 1.86,
            tpsa: 29.54,
            hDonors: 1,
            hAcceptors: 2,
            rotatableBonds: 3,
            lipinskiViolations: 0
          }
        });
      } else if (simulationType === 'admet') {
        setSimulationResults({
          type: 'admet',
          moleculeName: molecules.find(m => m.smiles === smiles)?.name || 'Custom Molecule',
          smiles: smiles,
          admet: {
            absorption: {
              oral: { score: 85, classification: 'High' },
              bbb: { score: 62, classification: 'Medium' },
              pgpSubstrate: { score: 32, classification: 'Unlikely' },
              f_oral: { percent: 78, classification: 'High' }
            },
            distribution: {
              vd: { vd: 1.8, classification: 'Moderate' },
              plasmaProteinBinding: { percent: 75.5, classification: 'Moderate' },
              tissueDistribution: {
                brain: 'Medium',
                adipose: 'Low',
                liver: 'High',
                kidney: 'Moderate'
              }
            },
            metabolism: {
              cyp450Substrates: {
                CYP3A4: { score: 72, isSubstrate: true },
                CYP2D6: { score: 45, isSubstrate: false },
                CYP2C9: { score: 38, isSubstrate: false }
              },
              cyp450Inhibition: {
                CYP3A4: { score: 35, inhibition: 'Weak' },
                CYP2D6: { score: 22, inhibition: 'Weak' },
                CYP2C9: { score: 18, inhibition: 'Weak' }
              },
              halfLife: { hours: 5.6, classification: 'Moderate' }
            },
            excretion: {
              renalClearance: { score: 65, classification: 'Moderate' }
            },
            toxicity: {
              herg: { score: 28, risk: 'Low' },
              hepatotoxicity: { score: 35, risk: 'Low' },
              cardiotoxicity: { score: 25, risk: 'Low' },
              mutagenicity: { score: 18, risk: 'Low' }
            }
          },
          properties: {
            molecularWeight: 165.23,
            logP: 1.86,
            tpsa: 29.54,
            hDonors: 1,
            hAcceptors: 2,
            rotatableBonds: 3,
            lipinskiViolations: 0
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while running the simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearResults = () => {
    setSimulationResults(null);
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Simulation Panel
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Simulation Parameters
            </Typography>
            
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              className={classes.tabs}
            >
              <Tab label="Select Molecule" />
              <Tab label="Enter SMILES" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel id="molecule-select-label">Select Molecule</InputLabel>
                <Select
                  labelId="molecule-select-label"
                  id="molecule-select"
                  value={smiles}
                  onChange={handleSmilesChange}
                  label="Select Molecule"
                >
                  <MenuItem value="">
                    <em>Select a molecule</em>
                  </MenuItem>
                  {molecules.map((molecule) => (
                    <MenuItem key={molecule.id} value={molecule.smiles}>
                      {molecule.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <TextField
                label="SMILES Notation"
                variant="outlined"
                fullWidth
                value={smiles}
                onChange={handleSmilesChange}
                placeholder="e.g., CC(N)CC1=CC=CC=C1"
                className={classes.formControl}
              />
            </TabPanel>
            
            <Divider className={classes.divider} />
            
            <Typography variant="subtitle1" gutterBottom>
              Simulation Type
            </Typography>
            
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel id="simulation-type-label">Simulation Type</InputLabel>
              <Select
                labelId="simulation-type-label"
                id="simulation-type"
                value={simulationType}
                onChange={handleSimulationTypeChange}
                label="Simulation Type"
              >
                <MenuItem value="binding">Receptor Binding Affinity</MenuItem>
                <MenuItem value="admet">ADMET Properties</MenuItem>
              </Select>
            </FormControl>
            
            {error && (
              <Alert severity="error" className={classes.alertMargin}>
                {error}
              </Alert>
            )}
            
            <div className={classes.buttonWrapper}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleRunSimulation}
                disabled={loading}
              >
                Run Simulation
              </Button>
              {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
            </div>
            
            {simulationResults && (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleClearResults}
                style={{ marginTop: 16 }}
              >
                Clear Results
              </Button>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {loading ? (
            <Paper className={classes.paper} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
              <CircularProgress />
            </Paper>
          ) : simulationResults ? (
            <Paper className={classes.paper}>
              <Typography variant="h6" gutterBottom>
                {simulationResults.moleculeName} - {simulationType === 'binding' ? 'Receptor Binding Affinity' : 'ADMET Properties'} Results
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <MoleculeViewer smiles={simulationResults.smiles} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Molecular Properties
                  </Typography>
                  
                  {simulationResults.properties && Object.entries(simulationResults.properties).map(([key, value]) => (
                    <div className={classes.propertyItem} key={key}>
                      <Typography className={classes.propertyLabel}>
                        {key === 'logP' ? 'LogP' :
                         key === 'tpsa' ? 'TPSA' :
                         key === 'hDonors' ? 'H-Bond Donors' :
                         key === 'hAcceptors' ? 'H-Bond Acceptors' :
                         key === 'lipinskiViolations' ? 'Lipinski Violations' :
                         key === 'rotatableBonds' ? 'Rotatable Bonds' :
                         key === 'molecularWeight' ? 'Molecular Weight' : key}
                      </Typography>
                      <Typography>
                        {typeof value === 'number' && key !== 'lipinskiViolations' ? value.toFixed(2) : value}
                        {key === 'molecularWeight' ? ' g/mol' : 
                         key === 'tpsa' ? ' Å²' : ''}
                      </Typography>
                    </div>
                  ))}
                </Grid>
              </Grid>
              
              <Divider className={classes.divider} />
              
              {simulationResults.type === 'binding' && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Receptor Binding Affinities
                  </Typography>
                  
                  <BindingAffinityChart data={simulationResults.bindingAffinities} />
                  
                  <div className={classes.resultsContainer}>
                    <Grid container spacing={2}>
                      {Object.entries(simulationResults.bindingAffinities).map(([receptor, value]) => (
                        <Grid item xs={12} sm={6} md={4} key={receptor}>
                          <div className={classes.propertyItem}>
                            <Typography className={classes.propertyLabel}>
                              {receptor}
                            </Typography>
                            <Typography>
                              {value.score}/100 ({value.classification})
                            </Typography>
                          </div>
                        </Grid>
                      ))}
                    </Grid>
                  </div>
                </>
              )}
              
              {simulationResults.type === 'admet' && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    ADMET Properties
                  </Typography>
                  
                  <AdmetPropertiesChart data={simulationResults.admet} />
                  
                  <div className={classes.resultsContainer}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Absorption
                        </Typography>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Oral Absorption</Typography>
                          <Typography>{simulationResults.admet.absorption.oral.classification} ({simulationResults.admet.absorption.oral.score}/100)</Typography>
                        </div>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Blood-Brain Barrier</Typography>
                          <Typography>{simulationResults.admet.absorption.bbb.classification} ({simulationResults.admet.absorption.bbb.score}/100)</Typography>
                        </div>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>P-gp Substrate</Typography>
                          <Typography>{simulationResults.admet.absorption.pgpSubstrate.classification}</Typography>
                        </div>
                        
                        <Typography variant="subtitle2" gutterBottom style={{ marginTop: 24 }}>
                          Distribution
                        </Typography>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Volume of Distribution</Typography>
                          <Typography>{simulationResults.admet.distribution.vd.vd} L/kg ({simulationResults.admet.distribution.vd.classification})</Typography>
                        </div>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Plasma Protein Binding</Typography>
                          <Typography>{simulationResults.admet.distribution.plasmaProteinBinding.percent}%</Typography>
                        </div>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Metabolism
                        </Typography>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>CYP3A4 Substrate</Typography>
                          <Typography>{simulationResults.admet.metabolism.cyp450Substrates.CYP3A4.isSubstrate ? 'Yes' : 'No'}</Typography>
                        </div>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Half-life</Typography>
                          <Typography>{simulationResults.admet.metabolism.halfLife.hours} hours ({simulationResults.admet.metabolism.halfLife.classification})</Typography>
                        </div>
                        
                        <Typography variant="subtitle2" gutterBottom style={{ marginTop: 24 }}>
                          Toxicity
                        </Typography>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>hERG Inhibition</Typography>
                          <Typography>{simulationResults.admet.toxicity.herg.risk} Risk</Typography>
                        </div>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Hepatotoxicity</Typography>
                          <Typography>{simulationResults.admet.toxicity.hepatotoxicity.risk} Risk</Typography>
                        </div>
                        
                        <div className={classes.propertyItem}>
                          <Typography className={classes.propertyLabel}>Cardiotoxicity</Typography>
                          <Typography>{simulationResults.admet.toxicity.cardiotoxicity.risk} Risk</Typography>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </>
              )}
              
              <Divider className={classes.divider} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" color="primary" fullWidth>
                    Export Results
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button variant="contained" color="primary" fullWidth>
                    Proceed to Regulatory Analysis
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Paper className={classes.paper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, flexDirection: 'column' }}>
              <AssessmentIcon className={classes.emptyStateIcon} />
              <Typography variant="h6" color="textSecondary">
                No simulation results
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Select a molecule and simulation type, then click "Run Simulation"
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export default SimulationPanel; 