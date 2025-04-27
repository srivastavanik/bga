import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, Switch, 
  FormControlLabel, CircularProgress, Divider
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DescriptionIcon from '@material-ui/icons/Description';
import regulatoryAPI from '../services/regulatoryAPI';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    height: '100%',
    minHeight: '70vh',
  },
  formControl: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  button: {
    marginTop: theme.spacing(2),
  },
  reportContainer: {
    padding: theme.spacing(2),
    whiteSpace: 'pre-wrap',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
  reportHeader: {
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  reportSection: {
    marginBottom: theme.spacing(2),
  },
}));

const RegulatoryAnalysis = () => {
  const classes = useStyles();
  const [molecules, setMolecules] = useState([]);
  const [selectedMolecule, setSelectedMolecule] = useState('');
  const [drugClass, setDrugClass] = useState('CNS stimulant');
  const [targetIndication, setTargetIndication] = useState('ADHD');
  const [primaryMechanism, setPrimaryMechanism] = useState('dopamine/norepinephrine reuptake inhibition');
  const [novelMechanism, setNovelMechanism] = useState(false);
  const [orphanDrug, setOrphanDrug] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch molecules on component mount
  useEffect(() => {
    const fetchMolecules = async () => {
      try {
        // This would typically come from your API
        // For now, we'll use some dummy data
        const dummyMolecules = [
          { id: 1, name: 'Methylphenidate', smiles: 'CN1C2CCC1CC(C2)OC(=O)C(C)C' },
          { id: 2, name: 'Amphetamine', smiles: 'CC(N)CC1=CC=CC=C1' },
          { id: 3, name: 'Modafinil', smiles: 'CC(C)(C)C(=O)NC(C(=O)NC)CS(=O)C1=CC=CC=C1' },
          { id: 4, name: 'Atomoxetine', smiles: 'CNCCC1=CC=CC=C1OC2=CC=CC=C2' },
        ];
        setMolecules(dummyMolecules);
      } catch (error) {
        console.error('Error fetching molecules:', error);
        setError('Failed to load molecules. Please try again later.');
      }
    };

    fetchMolecules();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedMolecule) {
      setError('Please select a molecule first');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const molecule = molecules.find(m => m.id === selectedMolecule);
      
      const params = {
        smiles: molecule.smiles,
        drugClass,
        targetIndication,
        primaryMechanism,
        novelMechanism,
        orphanDrug,
        fastTrack
      };

      const result = await regulatoryAPI.generateRegulatoryReport(params);
      setReport(result);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate regulatory report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Regulatory Analysis Report Generator
      </Typography>
      
      <Grid container spacing={4}>
        {/* Left side - Parameters */}
        <Grid item xs={12} md={5}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Analysis Parameters
            </Typography>
            
            <FormControl className={classes.formControl}>
              <InputLabel>Select Molecule</InputLabel>
              <Select
                value={selectedMolecule}
                onChange={(e) => setSelectedMolecule(e.target.value)}
              >
                {molecules.map((molecule) => (
                  <MenuItem key={molecule.id} value={molecule.id}>
                    {molecule.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl className={classes.formControl}>
              <InputLabel>Drug Class</InputLabel>
              <Select
                value={drugClass}
                onChange={(e) => setDrugClass(e.target.value)}
              >
                <MenuItem value="CNS stimulant">CNS stimulant</MenuItem>
                <MenuItem value="SNRI">SNRI</MenuItem>
                <MenuItem value="Eugeroic">Eugeroic</MenuItem>
                <MenuItem value="Nootropic">Nootropic</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl className={classes.formControl}>
              <InputLabel>Target Indication</InputLabel>
              <Select
                value={targetIndication}
                onChange={(e) => setTargetIndication(e.target.value)}
              >
                <MenuItem value="ADHD">ADHD</MenuItem>
                <MenuItem value="Narcolepsy">Narcolepsy</MenuItem>
                <MenuItem value="Cognitive Enhancement">Cognitive Enhancement</MenuItem>
                <MenuItem value="Depression">Depression</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl className={classes.formControl}>
              <InputLabel>Primary Mechanism</InputLabel>
              <Select
                value={primaryMechanism}
                onChange={(e) => setPrimaryMechanism(e.target.value)}
              >
                <MenuItem value="dopamine/norepinephrine reuptake inhibition">
                  Dopamine/norepinephrine reuptake inhibition
                </MenuItem>
                <MenuItem value="dopamine release">Dopamine release</MenuItem>
                <MenuItem value="histamine/orexin modulation">Histamine/orexin modulation</MenuItem>
                <MenuItem value="glutamate modulation">Glutamate modulation</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>
              Special Designations
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={novelMechanism}
                  onChange={(e) => setNovelMechanism(e.target.checked)}
                  color="primary"
                />
              }
              label="Novel Mechanism"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={orphanDrug}
                  onChange={(e) => setOrphanDrug(e.target.checked)}
                  color="primary"
                />
              }
              label="Orphan Drug"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={fastTrack}
                  onChange={(e) => setFastTrack(e.target.checked)}
                  color="primary"
                />
              }
              label="Fast Track"
            />
            
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleGenerateReport}
              disabled={loading || !selectedMolecule}
              startIcon={<DescriptionIcon />}
              fullWidth
            >
              Generate Report
            </Button>
            
            {error && (
              <Typography color="error" style={{ marginTop: '10px' }}>
                {error}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Right side - Report */}
        <Grid item xs={12} md={7}>
          <Paper className={classes.paper}>
            {loading ? (
              <div className={classes.loadingContainer}>
                <CircularProgress />
                <Typography variant="h6" style={{ marginTop: '20px' }}>
                  Generating regulatory analysis...
                </Typography>
                <Typography variant="body2" color="textSecondary" style={{ marginTop: '10px' }}>
                  This may take a minute as we analyze patents and regulatory pathways
                </Typography>
              </div>
            ) : report ? (
              <div className={classes.reportContainer}>
                <Typography variant="h5" className={classes.reportHeader}>
                  Regulatory Analysis Report
                </Typography>
                
                <Divider className={classes.divider} />
                
                {report.content && (
                  <div dangerouslySetInnerHTML={{ __html: report.content.replace(/\n/g, '<br/>') }} />
                )}
                
                {!report.content && (
                  <>
                    <div className={classes.reportSection}>
                      <Typography variant="h6">Executive Summary</Typography>
                      <Typography variant="body1">{report.summary || 'No summary available'}</Typography>
                    </div>
                    
                    <Divider className={classes.divider} />
                    
                    <div className={classes.reportSection}>
                      <Typography variant="h6">Patent Landscape</Typography>
                      <Typography variant="body1">{report.patentLandscape || 'No patent information available'}</Typography>
                    </div>
                    
                    <Divider className={classes.divider} />
                    
                    <div className={classes.reportSection}>
                      <Typography variant="h6">Regulatory Pathway</Typography>
                      <Typography variant="body1">{report.regulatoryPathway || 'No regulatory pathway information available'}</Typography>
                    </div>
                    
                    <Divider className={classes.divider} />
                    
                    <div className={classes.reportSection}>
                      <Typography variant="h6">Market Exclusivity</Typography>
                      <Typography variant="body1">{report.marketExclusivity || 'No market exclusivity information available'}</Typography>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={classes.loadingContainer}>
                <DescriptionIcon style={{ fontSize: 60, color: '#ccc' }} />
                <Typography variant="h6" color="textSecondary" style={{ marginTop: '20px' }}>
                  No regulatory analysis generated
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Select a molecule and parameters, then click "Generate Report"
                </Typography>
              </div>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RegulatoryAnalysis; 