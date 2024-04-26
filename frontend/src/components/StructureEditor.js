import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { 
  Paper, 
  Button, 
  CircularProgress, 
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  IconButton,
  Grid,
  Tooltip,
  Box
} from '@material-ui/core';
import { 
  Save, 
  Refresh, 
  FileCopy, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut,
  Close as CloseIcon
} from '@material-ui/icons';
import MoleculeViewer3D from './MoleculeViewer3D';
import axios from 'axios';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  editorContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    minHeight: '400px',
    position: 'relative',
    backgroundColor: '#f9f9f9',
  },
  ketcher: {
    width: '100%',
    height: '100%',
    minHeight: '400px',
  },
  controlsBar: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  button: {
    margin: theme.spacing(0.5),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  inputField: {
    marginBottom: theme.spacing(2),
  },
  infoText: {
    margin: theme.spacing(1, 0),
  },
  propertyPaper: {
    padding: theme.spacing(2),
    height: '100%',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  errorMessage: {
    color: theme.palette.error.main,
    marginTop: theme.spacing(1),
  },
  viewerContainer: {
    marginTop: theme.spacing(3),
  },
  propertyGrid: {
    marginTop: theme.spacing(2),
  },
  propertyLabel: {
    fontWeight: 'bold',
  },
  propertyValue: {
    marginLeft: theme.spacing(1),
  },
}));

const StructureEditor = ({ 
  initialMolecule = '',
  onMoleculeChange = () => {},
  readOnly = false,
  showControls = true,
  showProperties = true 
}) => {
  const classes = useStyles();
  const ketcherFrame = useRef(null);
  const ketcherInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ketcher, setKetcher] = useState(null);
  const [smiles, setSmiles] = useState('');
  const [molfile, setMolfile] = useState('');
  const [inputType, setInputType] = useState('editor');
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [properties, setProperties] = useState(null);
  const [is3DViewActive, setIs3DViewActive] = useState(false);

  // Initialize Ketcher
  useEffect(() => {
    const initializeKetcher = async () => {
      if (!ketcherFrame.current || ketcherInitialized.current) return;

      try {
        // Create iframe for Ketcher
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', '/ketcher/index.html');
        iframe.setAttribute('class', classes.ketcher);
        iframe.setAttribute('id', 'ketcher-frame');
        iframe.style.border = 'none';
        
        ketcherFrame.current.appendChild(iframe);
        
        // Wait for Ketcher to initialize
        iframe.onload = () => {
          const ketcherWindow = iframe.contentWindow;
          
          const checkKetcher = setInterval(() => {
            if (ketcherWindow.ketcher) {
              clearInterval(checkKetcher);
              setKetcher(ketcherWindow.ketcher);
              ketcherInitialized.current = true;
              setIsLoading(false);
              
              // Load initial molecule if provided
              if (initialMolecule) {
                setTimeout(() => {
                  loadMolecule(initialMolecule);
                }, 1000);
              }
            }
          }, 300);
        };
      } catch (error) {
        console.error('Error initializing Ketcher:', error);
        setErrorMessage('Failed to initialize molecule editor.');
        setIsLoading(false);
      }
    };

    initializeKetcher();

    return () => {
      ketcherInitialized.current = false;
    };
  }, [initialMolecule]);

  // Function to load a molecule into Ketcher
  const loadMolecule = async (data) => {
    if (!ketcher) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Determine format and load
      if (data.startsWith('InChI=')) {
        await ketcher.setMolecule(data);
      } else if (data.includes('\n') || data.includes('M  END')) {
        // Looks like molfile
        await ketcher.setMolecule(data);
      } else {
        // Assume SMILES
        const response = await axios.post('/api/simulation/convert', {
          input: data,
          inputFormat: 'smiles',
          outputFormat: 'mol'
        });
        
        if (response.data && response.data.output) {
          await ketcher.setMolecule(response.data.output);
        } else {
          throw new Error('Failed to convert SMILES to molfile');
        }
      }
      
      updateMoleculeData();
    } catch (error) {
      console.error('Error loading molecule:', error);
      setErrorMessage(`Failed to load molecule: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update molecule data
  const updateMoleculeData = async () => {
    if (!ketcher) return;
    
    try {
      const mol = await ketcher.getMolfile();
      setMolfile(mol);
      
      const response = await axios.post('/api/simulation/convert', {
        input: mol,
        inputFormat: 'mol',
        outputFormat: 'smiles'
      });
      
      if (response.data && response.data.output) {
        const newSmiles = response.data.output.trim();
        setSmiles(newSmiles);
        onMoleculeChange(newSmiles);
        
        // Get properties if enabled
        if (showProperties) {
          calculateProperties(newSmiles);
        }
      }
    } catch (error) {
      console.error('Error updating molecule data:', error);
    }
  };

  // Calculate molecular properties
  const calculateProperties = async (smilesString) => {
    try {
      const response = await axios.post('/api/simulation/properties', {
        smiles: smilesString
      });
      
      if (response.data) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error('Error calculating properties:', error);
    }
  };

  // Handle input type change
  const handleInputTypeChange = (event) => {
    setInputType(event.target.value);
  };

  // Handle input value change
  const handleInputValueChange = (event) => {
    setInputValue(event.target.value);
  };

  // Load molecule from input
  const handleLoadMolecule = () => {
    if (!inputValue.trim()) {
      setErrorMessage('Please enter a valid molecule string');
      return;
    }
    
    loadMolecule(inputValue.trim());
    setInputValue('');
  };

  // Handle undo
  const handleUndo = async () => {
    if (!ketcher) return;
    try {
      await ketcher.undo();
      updateMoleculeData();
    } catch (error) {
      console.error('Error performing undo:', error);
    }
  };

  // Handle redo
  const handleRedo = async () => {
    if (!ketcher) return;
    try {
      await ketcher.redo();
      updateMoleculeData();
    } catch (error) {
      console.error('Error performing redo:', error);
    }
  };

  // Handle clear
  const handleClear = async () => {
    if (!ketcher) return;
    try {
      await ketcher.clear();
      updateMoleculeData();
    } catch (error) {
      console.error('Error clearing editor:', error);
    }
  };

  // Copy SMILES to clipboard
  const copySmilesToClipboard = () => {
    if (!smiles) return;
    
    navigator.clipboard.writeText(smiles).then(
      () => {
        setSnackbarMessage('SMILES copied to clipboard');
        setSnackbarOpen(true);
      },
      (err) => {
        console.error('Failed to copy: ', err);
        setSnackbarMessage('Failed to copy SMILES');
        setSnackbarOpen(true);
      }
    );
  };

  // Save the current molecule
  const handleSave = async () => {
    if (!ketcher || !smiles) return;
    
    try {
      const mol = await ketcher.getMolfile();
      
      // Prepare molecule data
      const moleculeData = {
        smiles,
        molfile: mol,
        name: 'Untitled Molecule',
        dateCreated: new Date().toISOString(),
        properties: properties || {}
      };
      
      // Save to backend
      const response = await axios.post('/api/drug-design/molecules', moleculeData);
      
      if (response.data && response.data.id) {
        setSnackbarMessage('Molecule saved successfully');
        setSnackbarOpen(true);
      } else {
        throw new Error('Failed to save molecule');
      }
    } catch (error) {
      console.error('Error saving molecule:', error);
      setSnackbarMessage('Failed to save molecule');
      setSnackbarOpen(true);
    }
  };

  // Toggle 3D view
  const toggle3DView = () => {
    setIs3DViewActive(!is3DViewActive);
  };

  // Close snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          Molecular Structure Editor
        </Typography>
        
        {showControls && (
          <div className={classes.controlsBar}>
            <Tooltip title="Undo">
              <IconButton className={classes.button} onClick={handleUndo} disabled={isLoading}>
                <Undo />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton className={classes.button} onClick={handleRedo} disabled={isLoading}>
                <Redo />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear">
              <Button
                variant="outlined"
                className={classes.button}
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </Button>
            </Tooltip>
            <Tooltip title="Copy SMILES">
              <IconButton 
                className={classes.button} 
                onClick={copySmilesToClipboard} 
                disabled={!smiles || isLoading}
              >
                <FileCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save Molecule">
              <IconButton 
                className={classes.button} 
                onClick={handleSave} 
                disabled={!smiles || isLoading}
                color="primary"
              >
                <Save />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color={is3DViewActive ? "primary" : "default"}
              className={classes.button}
              onClick={toggle3DView}
              disabled={!smiles || isLoading}
            >
              {is3DViewActive ? "2D Editor" : "3D View"}
            </Button>
          </div>
        )}
        
        <div className={classes.editorContainer}>
          {!is3DViewActive ? (
            <div ref={ketcherFrame} className={classes.ketcher} />
          ) : (
            <div className={classes.viewerContainer}>
              <MoleculeViewer3D
                moleculeData={smiles}
                format="smiles"
                height={400}
              />
            </div>
          )}
          
          {isLoading && (
            <div className={classes.loading}>
              <CircularProgress />
            </div>
          )}
        </div>
        
        {errorMessage && (
          <Typography className={classes.errorMessage}>
            {errorMessage}
          </Typography>
        )}
        
        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom>
            Import Structure
          </Typography>
          
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Input Type</FormLabel>
            <RadioGroup
              row
              value={inputType}
              onChange={handleInputTypeChange}
            >
              <FormControlLabel
                value="smiles"
                control={<Radio color="primary" />}
                label="SMILES"
              />
              <FormControlLabel
                value="molfile"
                control={<Radio color="primary" />}
                label="Molfile"
              />
              <FormControlLabel
                value="inchi"
                control={<Radio color="primary" />}
                label="InChI"
              />
            </RadioGroup>
          </FormControl>
          
          <TextField
            label={`Enter ${inputType === 'smiles' ? 'SMILES' : inputType === 'molfile' ? 'Molfile' : 'InChI'}`}
            variant="outlined"
            fullWidth
            multiline={inputType === 'molfile'}
            rows={inputType === 'molfile' ? 4 : 1}
            value={inputValue}
            onChange={handleInputValueChange}
            className={classes.inputField}
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleLoadMolecule}
            disabled={!inputValue.trim() || isLoading}
          >
            Load Molecule
          </Button>
        </Box>
      </Paper>
      
      {showProperties && properties && (
        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Molecular Properties
          </Typography>
          
          <Grid container spacing={2} className={classes.propertyGrid}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>Formula:</span>
                <span className={classes.propertyValue}>{properties.formula}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>Molecular Weight:</span>
                <span className={classes.propertyValue}>{properties.molWeight?.toFixed(2)} g/mol</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>LogP:</span>
                <span className={classes.propertyValue}>{properties.logP?.toFixed(2)}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>TPSA:</span>
                <span className={classes.propertyValue}>{properties.tpsa?.toFixed(2)} Å²</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>H-Bond Donors:</span>
                <span className={classes.propertyValue}>{properties.hbondDonorCount}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>H-Bond Acceptors:</span>
                <span className={classes.propertyValue}>{properties.hbondAcceptorCount}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>Rotatable Bonds:</span>
                <span className={classes.propertyValue}>{properties.rotatableBondCount}</span>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <span className={classes.propertyLabel}>Lipinski Violations:</span>
                <span className={classes.propertyValue}>{properties.lipinskiViolations}</span>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default StructureEditor; 