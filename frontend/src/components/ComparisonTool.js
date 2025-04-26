import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Divider, 
  CircularProgress, 
  Chip,
  makeStyles 
} from '@material-ui/core';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import DeleteIcon from '@material-ui/icons/Delete';
import Alert from '@material-ui/lab/Alert';
import { simulationAPI } from '../services/api';
import { saveTestMolecules, clearTestMolecules } from '../utils/testData';


const MoleculeViewer = ({ smiles, height = 250 }) => {
  const viewerRef = useRef(null);
  
  useEffect(() => {
    if (smiles && viewerRef.current) {
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

// This would be imported from a third-party library in a real implementation
const SimilarityChart = ({ molecules, similarity }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (molecules && similarity && chartRef.current) {
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
      text.innerHTML = '<strong>Tanimoto Similarity</strong><br><br>';
      text.style.textAlign = 'center';
      text.style.padding = '20px';
      
      const similarityText = document.createElement('div');
      similarityText.style.fontSize = '2rem';
      similarityText.style.fontWeight = 'bold';
      similarityText.innerHTML = `${(similarity * 100).toFixed(1)}%`;
      
      const description = document.createElement('div');
      description.style.marginTop = '16px';
      description.innerHTML = `Similarity between ${molecules[0].name} and ${molecules[1].name}<br>Based on Morgan fingerprint Tanimoto coefficient`;
      
      placeholder.appendChild(text);
      placeholder.appendChild(similarityText);
      placeholder.appendChild(description);
      
      chartRef.current.innerHTML = '';
      chartRef.current.appendChild(placeholder);
    }
  }, [molecules, similarity]);
  
  return <div ref={chartRef} style={{ width: '100%', height: '300px', border: '1px solid #e0e0e0' }}></div>;
};


const PropertyComparisonChart = ({ data }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (data && chartRef.current) {

      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '400px';
      placeholder.style.backgroundColor = '#f5f5f5';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      
      const text = document.createElement('div');
      text.innerHTML = '<strong>Property Comparison Chart</strong><br><br>Bar chart comparing properties would render here';
      text.style.textAlign = 'center';
      text.style.padding = '20px';
      
      placeholder.appendChild(text);
      
      chartRef.current.innerHTML = '';
      chartRef.current.appendChild(placeholder);
    }
  }, [data]);
  
  return <div ref={chartRef} style={{ width: '100%', height: '400px', border: '1px solid #e0e0e0' }}></div>;
};

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2),
    maxWidth: '100%',
    overflowX: 'hidden'
  },
  title: {
    marginBottom: theme.spacing(2),
    fontWeight: 500,
    fontSize: '1.5rem'
  },
  paper: {
    padding: theme.spacing(2),
    height: '100%',
    overflowX: 'hidden'
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    width: '100%',
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderRadius: theme.shape.borderRadius,
      }
    },
    '& .MuiSelect-select': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingRight: '32px' // Space for the dropdown icon
    }
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  moleculeSelector: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    width: '100%'
  },
  compareButton: {
    marginTop: theme.spacing(2)
  },
  progress: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(4, 0),
  },
  propertyContainer: {
    marginTop: theme.spacing(2),
    overflowX: 'auto'
  },
  propertyRow: {
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: theme.spacing(1),
    alignItems: 'center',
    minWidth: 600
  },
  propertyLabel: {
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  propertyValue: {
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  smilesText: {
    fontSize: '0.75rem',
    wordBreak: 'break-all',
    maxWidth: '100%',
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0, 1)
  },
  similarityCard: {
    padding: theme.spacing(2),
    textAlign: 'center',
    width: '100%',
    maxWidth: 400,
    margin: '0 auto'
  },
  mcsInfo: {
    marginTop: theme.spacing(1),
    fontSize: '0.875rem',
    '& code': {
      display: 'block',
      marginTop: theme.spacing(0.5),
      padding: theme.spacing(1),
      background: theme.palette.grey[100],
      borderRadius: 4,
      wordBreak: 'break-all',
      fontSize: '0.75rem'
    }
  },
  comparisonHeader: {
    fontSize: '1.25rem',
    marginBottom: theme.spacing(2)
  },
  actionButtons: {
    marginTop: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(2)
  },
  better: {
    color: theme.palette.success.main,
    fontWeight: 500,
  },
  worse: {
    color: theme.palette.error.main,
    fontWeight: 500,
  },
  neutral: {
    color: theme.palette.text.primary,
  },
  sectionTitle: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
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
  deleteButton: {
    marginLeft: theme.spacing(1),
  },
  alertMargin: {
    marginBottom: theme.spacing(2),
  },
  selectionContainer: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  moleculeSelectionGrid: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto'
  },
  compareIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(1)
  },
  compareIcon: {
    fontSize: 32,
    color: theme.palette.text.secondary,
    transition: 'transform 0.3s ease-in-out, color 0.3s ease-in-out',
    '&:hover': {
      transform: 'rotate(180deg)',
      color: theme.palette.primary.main,
      cursor: 'pointer'
    }
  },
  moleculeMenuItem: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& .smiles-preview': {
      color: theme.palette.text.secondary,
      fontSize: '0.85em'
    }
  }
}));

const ComparisonTool = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [selectedMolecules, setSelectedMolecules] = useState([null, null]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [error, setError] = useState(null);
  const [availableMolecules, setAvailableMolecules] = useState([]);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Load saved molecules from localStorage
  useEffect(() => {
    const loadMolecules = () => {
      try {
        const storedMolecules = localStorage.getItem('savedMolecules');
        if (storedMolecules) {
          const parsedMolecules = JSON.parse(storedMolecules);
          setAvailableMolecules(parsedMolecules);
          setError(null);
        } else {
          setError('No saved molecules found. Please save some molecules first or use test mode.');
        }
      } catch (err) {
        console.error('Error loading molecules:', err);
        setError('Error loading saved molecules');
      }
    };
    
    loadMolecules();
  }, []);
  
  const handleMoleculeChange = (index, event) => {
    const value = event.target.value;
    const newSelectedMolecules = [...selectedMolecules];
    newSelectedMolecules[index] = value ? availableMolecules.find(m => m.id === value) : null;
    setSelectedMolecules(newSelectedMolecules);
    setComparisonResults(null);
    setError(null);
  };
  
  const handleClearMolecule = (index) => {
    const newSelectedMolecules = [...selectedMolecules];
    newSelectedMolecules[index] = null;
    setSelectedMolecules(newSelectedMolecules);
    setComparisonResults(null);
    setError(null);
  };
  
  const handleSwapMolecules = () => {
    setSelectedMolecules([selectedMolecules[1], selectedMolecules[0]]);
    setComparisonResults(null);
    setError(null);
  };
  
  const handleCompare = async () => {
    if (!selectedMolecules[0]?.smiles || !selectedMolecules[1]?.smiles) {
      setError('Please select two molecules to compare');
      return;
    }
    
    setLoading(true);
    setError(null);
    setComparisonResults(null);
    
    try {
      console.log('Comparing molecules:', {
        molecule1: selectedMolecules[0].name,
        smiles1: selectedMolecules[0].smiles,
        molecule2: selectedMolecules[1].name,
        smiles2: selectedMolecules[1].smiles
      });

      const response = await simulationAPI.compareMolecules(
        selectedMolecules[0].smiles,
        selectedMolecules[1].smiles
      );
      
      if (response.data?.result?.similarity?.score === undefined || 
          isNaN(response.data?.result?.similarity?.score)) {
        throw new Error('Invalid similarity score received from server');
      }
      
      if (response.data && response.data.result) {
        console.log('Comparison results:', response.data.result);
        setComparisonResults({
          molecules: selectedMolecules,
          similarity: response.data.result.similarity,
          properties1: response.data.result.molecule1.properties,
          properties2: response.data.result.molecule2.properties,
          mcs: response.data.result.mcs
        });
      } else {
        throw new Error(response.data?.error || 'Failed to compare molecules');
      }
    } catch (err) {
      console.error('Error comparing molecules:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred during comparison. Please try again.');
      setComparisonResults(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearComparison = () => {
    setComparisonResults(null);
    setSelectedMolecules([null, null]);
    setError(null);
  };
  
  const formatPropertyName = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
  };
  
  const getPropertyUnits = (key) => {
    if (key === 'molWeight') return ' g/mol';
    if (key === 'tpsa') return ' Å²';
    return '';
  };
  
  const getComparisonClass = (key, value1, value2) => {
    if (typeof value1 !== 'number' || typeof value2 !== 'number') return classes.neutral;
    const difference = value2 - value1;
    const threshold = 0.01; // Minimum difference to show color

    // Don't color extremely small differences
    if (Math.abs(difference) < threshold) return classes.neutral;

    // Green for positive differences, red for negative
    return difference > 0 ? classes.better : classes.worse;
  };

  const handleEnableTestMode = () => {
    saveTestMolecules();
    setIsTestMode(true);
    const storedMolecules = localStorage.getItem('savedMolecules');
    if (storedMolecules) {
      setAvailableMolecules(JSON.parse(storedMolecules));
      setError(null);
    }
  };

  const handleDisableTestMode = () => {
    clearTestMolecules();
    setIsTestMode(false);
    setSelectedMolecules([null, null]);
    setComparisonResults(null);
    setAvailableMolecules([]);
    setError('Test mode disabled. Please save some molecules to compare.');
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Molecule Comparison Tool
      </Typography>
      
      <Paper className={classes.paper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="h6">
            Select Molecules to Compare
          </Typography>
          {!isTestMode ? (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleEnableTestMode}
              disabled={availableMolecules.length > 0}
            >
              Enable Test Mode
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleDisableTestMode}
            >
              Disable Test Mode
            </Button>
          )}
        </div>
        
        {availableMolecules.length === 0 ? (
          <div className={classes.emptyState}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              No saved molecules found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please save some molecules using the Molecule Designer or Structure Editor before comparing,
              or enable test mode to try the comparison tool with sample molecules.
            </Typography>
          </div>
        ) : (
          <div className={classes.selectionContainer}>
            <Grid container className={classes.moleculeSelectionGrid} spacing={2}>
              <Grid item xs={12} md={5}>
                <FormControl variant="outlined" className={classes.formControl}>
                  <InputLabel id="molecule1-label">Molecule 1</InputLabel>
                  <Select
                    labelId="molecule1-label"
                    value={selectedMolecules[0]?.id || ''}
                    onChange={(e) => handleMoleculeChange(0, e)}
                    label="Molecule 1"
                  >
                    <MenuItem value="">
                      <em>Select a molecule</em>
                    </MenuItem>
                    {availableMolecules.map((molecule) => (
                      <MenuItem 
                        key={molecule.id} 
                        value={molecule.id}
                        disabled={selectedMolecules[1]?.id === molecule.id}
                        className={classes.moleculeMenuItem}
                      >
                        <div>
                          {molecule.name}
                          <div className="smiles-preview">
                            {molecule.smiles.length > 30 
                              ? `${molecule.smiles.substring(0, 30)}...` 
                              : molecule.smiles}
                          </div>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2} className={classes.compareIconContainer}>
                <CompareArrowsIcon 
                  className={classes.compareIcon} 
                  onClick={handleSwapMolecules}
                  style={{ cursor: 'pointer' }}
                />
              </Grid>
              
              <Grid item xs={12} md={5}>
                <FormControl variant="outlined" className={classes.formControl}>
                  <InputLabel id="molecule2-label">Molecule 2</InputLabel>
                  <Select
                    labelId="molecule2-label"
                    value={selectedMolecules[1]?.id || ''}
                    onChange={(e) => handleMoleculeChange(1, e)}
                    label="Molecule 2"
                  >
                    <MenuItem value="">
                      <em>Select a molecule</em>
                    </MenuItem>
                    {availableMolecules.map((molecule) => (
                      <MenuItem 
                        key={molecule.id} 
                        value={molecule.id}
                        disabled={selectedMolecules[0]?.id === molecule.id}
                        className={classes.moleculeMenuItem}
                      >
                        <div>
                          {molecule.name}
                          <div className="smiles-preview">
                            {molecule.smiles.length > 30 
                              ? `${molecule.smiles.substring(0, 30)}...` 
                              : molecule.smiles}
                          </div>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>
        )}
        
        {error && (
          <Alert severity="error" className={classes.alertMargin} style={{ marginTop: 16 }}>
            {error}
          </Alert>
        )}
        
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {!comparisonResults ? (
            <Button
              variant="contained"
              color="primary"
              className={classes.compareButton}
              onClick={handleCompare}
              disabled={!selectedMolecules[0] || !selectedMolecules[1] || loading}
            >
              Compare Molecules
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              className={classes.compareButton}
              onClick={handleClearComparison}
            >
              Clear Comparison
            </Button>
          )}
        </div>
        
        {loading && (
          <div className={classes.progress}>
            <CircularProgress />
          </div>
        )}
        
        {comparisonResults && !loading && (
          <>
            <Divider className={classes.divider} />
            
            <Typography variant="h6" className={classes.comparisonHeader}>
              Comparison Results: {comparisonResults.molecules[0]?.name || 'Molecule 1'} 
              {comparisonResults.molecules[0]?.id === comparisonResults.molecules[1]?.id ? 
                ' (Same molecule)' : 
                ` vs. ${comparisonResults.molecules[1]?.name || 'Molecule 2'}`}
            </Typography>
            
            {comparisonResults.molecules[0]?.id === comparisonResults.molecules[1]?.id && (
              <Alert severity="info" className={classes.alertMargin}>
                Note: You are comparing the same molecule with itself. The similarity will be 100% in this case.
              </Alert>
            )}
            
            <Paper variant="outlined" className={classes.similarityCard}>
              <Typography variant="h4" gutterBottom>
                {(comparisonResults.similarity.score * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption" display="block" gutterBottom>
                Tanimoto Similarity (Morgan Fingerprints)
              </Typography>
              {comparisonResults.mcs && (
                <div className={classes.mcsInfo}>
                  <Chip 
                    size="small" 
                    label={`MCS: ${comparisonResults.mcs.num_atoms} atoms, ${comparisonResults.mcs.num_bonds} bonds`}
                  />
                  <code>{comparisonResults.mcs.smarts}</code>
                </div>
              )}
            </Paper>
            
            <Typography variant="subtitle1" className={classes.sectionTitle}>
              Detailed Property Comparison
            </Typography>
            
            <div className={classes.propertyContainer}>
              <div className={classes.propertyRow} style={{ backgroundColor: '#f5f5f5', fontWeight: 500 }}>
                <div className={classes.propertyLabel}>Property</div>
                <div className={classes.propertyValue}>{comparisonResults.molecules[0]?.name || 'Molecule 1'}</div>
                <div className={classes.propertyValue}>{comparisonResults.molecules[1]?.name || 'Molecule 2'}</div>
                <div className={classes.propertyValue}>Difference</div>
              </div>
              
              {comparisonResults.properties1 && Object.keys(comparisonResults.properties1).map((key) => {
                const val1 = comparisonResults.properties1[key];
                const val2 = comparisonResults.properties2 ? comparisonResults.properties2[key] : undefined;
                const diff = (typeof val1 === 'number' && typeof val2 === 'number') ? (val2 - val1) : 'N/A';
                const units = getPropertyUnits(key);
                
                return (
                  <div className={classes.propertyRow} key={key}>
                    <div className={classes.propertyLabel}>{formatPropertyName(key)}</div>
                    <div className={classes.propertyValue}>{(typeof val1 === 'number' ? val1.toFixed(2) : val1)}{units}</div>
                    <div className={classes.propertyValue}>{(typeof val2 === 'number' ? val2.toFixed(2) : val2)}{units}</div>
                    <div className={`${classes.propertyValue} ${getComparisonClass(key, val1, val2)}`}>
                      {typeof diff === 'number' ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : diff}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Divider className={classes.divider} />
            
            <div className={classes.actionButtons}>
              <Button variant="outlined" color="primary" fullWidth>
                Export Comparison
              </Button>
              <Button variant="contained" color="primary" fullWidth>
                Add to Report
              </Button>
            </div>
          </>
        )}
        
        {!comparisonResults && !loading && (
          <div className={classes.emptyState}>
            <CompareArrowsIcon className={classes.emptyStateIcon} />
            <Typography variant="h6" color="textSecondary">
              Select molecules to compare
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Choose two molecules and click "Compare Molecules" to see a detailed comparison
            </Typography>
          </div>
        )}
      </Paper>
    </div>
  );
};

export default ComparisonTool; 