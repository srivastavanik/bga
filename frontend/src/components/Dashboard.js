import React from 'react';
import { 
  Typography, 
  Grid, 
  Paper,
  makeStyles,
  Box,
  Card,
  CardContent,
} from '@material-ui/core';
import BuildIcon from '@material-ui/icons/Build';
import CompareIcon from '@material-ui/icons/Compare';
import SearchIcon from '@material-ui/icons/Search';
import TimelineIcon from '@material-ui/icons/Timeline';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(4),
    background: 'linear-gradient(135deg, #fff5f2 0%, #fff9f7 100%)',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing(8),
  },
  title: {
    fontWeight: 800,
    color: '#E27B58',
    fontSize: '3.5rem',
    marginBottom: theme.spacing(2),
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: 'Inter, sans-serif',
    '& span': {
      background: 'linear-gradient(45deg, #E27B58 30%, #F29E7A 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#666',
    maxWidth: '800px',
    margin: '0 auto',
    lineHeight: 1.6,
    fontFamily: 'Inter, sans-serif',
  },
  overview: {
    marginBottom: theme.spacing(8),
    padding: theme.spacing(6),
    borderRadius: theme.spacing(2),
    background: 'linear-gradient(135deg, #ffffff 0%, #fff5f2 100%)',
    boxShadow: '0 4px 20px rgba(226, 123, 88, 0.08)',
    '& p': {
      fontSize: '1.1rem',
      lineHeight: 1.7,
      color: '#4A4A4A',
      marginBottom: theme.spacing(2),
      fontFamily: 'Inter, sans-serif',
    }
  },
  featureCard: {
    height: '100%',
    borderRadius: theme.spacing(2),
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    background: 'linear-gradient(135deg, #ffffff 0%, #fff9f7 100%)',
    border: '1px solid rgba(226, 123, 88, 0.1)',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 12px 24px rgba(226, 123, 88, 0.12)',
      borderColor: '#E27B58',
    }
  },
  cardContent: {
    padding: theme.spacing(4),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: theme.spacing(2),
    color: '#E27B58',
  },
  featureTitle: {
    fontWeight: 700,
    fontSize: '1.4rem',
    color: '#E27B58',
    marginBottom: theme.spacing(2),
    fontFamily: 'Inter, sans-serif',
  },
  featureDescription: {
    color: '#666',
    lineHeight: 1.6,
    fontFamily: 'Inter, sans-serif',
  },
  divider: {
    margin: theme.spacing(6, 0),
    width: '100%',
    maxWidth: '200px',
    height: '4px',
    background: 'linear-gradient(45deg, #E27B58 30%, #F29E7A 90%)',
    borderRadius: '2px',
    border: 'none',
  }
}));

const Dashboard = () => {
  const classes = useStyles();

  const features = [
    {
      icon: <BuildIcon className={classes.icon} />,
      title: "Molecule Designer",
      description: "Create and modify chemical structures with our intuitive molecular design tools."
    },
    {
      icon: <CompareIcon className={classes.icon} />,
      title: "Comparison Tool",
      description: "Compare molecular structures and analyze their similarities and differences."
    },
    {
      icon: <SearchIcon className={classes.icon} />,
      title: "Literature Explorer",
      description: "Search and analyze scientific literature related to your molecular research."
    },
    {
      icon: <TimelineIcon className={classes.icon} />,
      title: "Simulations",
      description: "Run advanced simulations to predict molecular properties and behavior."
    }
  ];

  return (
    <div className={classes.root}>
      <Box className={classes.header}>
        <Typography variant="h1" className={classes.title}>
          Welcome to <span>Breaking Good</span>
        </Typography>
        <Typography variant="h2" className={classes.subtitle}>
          Your comprehensive platform for drug discovery and molecular design
        </Typography>
      </Box>
      
      <Paper className={classes.overview} elevation={0}>
        <Typography variant="body1">
          Breaking Good provides a suite of powerful tools for molecular design and analysis. Our platform combines cutting-edge technology with an intuitive interface to streamline your drug discovery process.
        </Typography>
        <Typography variant="body1">
          Whether you're designing new molecules, analyzing existing compounds, or exploring scientific literature, Breaking Good offers the tools you need to accelerate your research.
        </Typography>
      </Paper>

      <hr className={classes.divider} />

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card className={classes.featureCard} elevation={0}>
              <CardContent className={classes.cardContent}>
                {feature.icon}
                <Typography className={classes.featureTitle}>
                  {feature.title}
                </Typography>
                <Typography className={classes.featureDescription}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default Dashboard; 