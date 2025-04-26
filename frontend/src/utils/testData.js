// Test molecules for development and testing
export const testMolecules = [
  {
    id: '1',
    name: 'Methylphenidate',
    smiles: 'CN(C)C(C1=CC=CC=C1)C(C)OC(=O)C',
    dateCreated: new Date().toISOString(),
    categories: ['stimulants', 'adhd treatments'],
    properties: {
      molecularWeight: '233.31',
      logP: '2.15'
    }
  },
  {
    id: '2',
    name: 'Amphetamine',
    smiles: 'CC(N)CC1=CC=CC=C1',
    dateCreated: new Date().toISOString(),
    categories: ['stimulants'],
    properties: {
      molecularWeight: '135.21',
      logP: '1.76'
    }
  },
  {
    id: '3',
    name: 'Novel Dopamine Modulator',
    smiles: 'CC1=CC(=C(C=C1)NC(=O)C)NC2=CC=CC=C2',
    dateCreated: new Date().toISOString(),
    categories: ['novel compounds'],
    properties: {
      molecularWeight: '254.32',
      logP: '3.21'
    }
  }
];

// Function to save test molecules to localStorage
export const saveTestMolecules = () => {
  try {
    localStorage.setItem('savedMolecules', JSON.stringify(testMolecules));
    console.log('Test molecules saved to localStorage');
    return true;
  } catch (error) {
    console.error('Error saving test molecules:', error);
    return false;
  }
};

// Function to clear test molecules from localStorage
export const clearTestMolecules = () => {
  try {
    localStorage.removeItem('savedMolecules');
    console.log('Test molecules cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing test molecules:', error);
    return false;
  }
}; 