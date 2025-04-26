#!/usr/bin/env python3
import sys
import json
import argparse
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, Crippen, Lipinski, QED, DataStructs, rdFMCS
from rdkit.Chem.Draw import rdMolDraw2D

def parse_args():
    parser = argparse.ArgumentParser(description='RDKit Molecule Operations')
    parser.add_argument('operation', type=str,
                        choices=['validate', 'descriptors', 'svg', 'optimize_3d', 'fingerprint', 'compare'],
                        help='Operation to perform')
    parser.add_argument('smiles1', type=str, nargs='?', help='First SMILES string (for comparison)')
    parser.add_argument('smiles2', type=str, nargs='?', help='Second SMILES string (for comparison)')
    parser.add_argument('--method', type=str, default='tanimoto', 
                       choices=['tanimoto', 'dice', 'cosine'],
                       help='Similarity calculation method')
    parser.add_argument('--output', type=str, default='json', choices=['json', 'text'],
                        help='Output format')
    return parser.parse_args()

def validate_smiles(smiles):
    """Validate a SMILES string and return canonical SMILES"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"valid": False, "canonical_smiles": None, "error": "Invalid SMILES string"}
    
    canonical_smiles = Chem.MolToSmiles(mol)
    return {"valid": True, "canonical_smiles": canonical_smiles}

def calculate_descriptors(smiles):
    """Calculate molecular descriptors for a given SMILES string"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"error": "Invalid SMILES string"}
    
    # Add hydrogens to get a more accurate representation
    mol = Chem.AddHs(mol)
    
    # Calculate basic descriptors
    descriptors = {
        "molecular_weight": Descriptors.MolWt(mol),
        "logp": Crippen.MolLogP(mol),
        "num_h_donors": Lipinski.NumHDonors(mol),
        "num_h_acceptors": Lipinski.NumHAcceptors(mol),
        "num_rotatable_bonds": Descriptors.NumRotatableBonds(mol),
        "num_rings": Descriptors.RingCount(mol),
        "tpsa": Descriptors.TPSA(mol),
        "qed": QED.qed(mol),
        "formula": Chem.rdMolDescriptors.CalcMolFormula(mol)
    }
    
    # Check Lipinski's Rule of Five
    lipinski_violations = 0
    if descriptors["molecular_weight"] > 500: lipinski_violations += 1
    if descriptors["logp"] > 5: lipinski_violations += 1
    if descriptors["num_h_donors"] > 5: lipinski_violations += 1
    if descriptors["num_h_acceptors"] > 10: lipinski_violations += 1
    
    descriptors["lipinski_violations"] = lipinski_violations
    
    return descriptors

def generate_svg(smiles):
    """Generate SVG representation of a molecule"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"error": "Invalid SMILES string"}
    
    # Generate 2D coordinates if not present
    if not mol.GetNumConformers():
        AllChem.Compute2DCoords(mol)
    
    drawer = rdMolDraw2D.MolDraw2DSVG(400, 300)
    drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    svg = drawer.GetDrawingText()
    
    return {"svg": svg}

def optimize_3d(smiles):
    """Generate and optimize 3D coordinates for a molecule"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"error": "Invalid SMILES string"}
    
    # Add hydrogens
    mol = Chem.AddHs(mol)
    
    # Generate 3D coordinates
    AllChem.EmbedMolecule(mol, AllChem.ETKDG())
    
    # Optimize the structure
    AllChem.MMFFOptimizeMolecule(mol)
    
    # Convert to PDB format
    pdb_string = Chem.MolToPDBBlock(mol)
    
    return {"pdb": pdb_string}

def generate_fingerprint(smiles):
    """Generate Morgan fingerprint for a molecule"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"error": "Invalid SMILES string"}
    
    # Generate Morgan fingerprint (ECFP4)
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, 2, nBits=1024)
    fp_bits = list(fp.GetOnBits())
    
    return {"fingerprint": fp_bits}

def compare_molecules(smiles1, smiles2, method='tanimoto'):
    """Compare two molecules and calculate their similarity"""
    # Parse SMILES strings
    mol1 = Chem.MolFromSmiles(smiles1)
    mol2 = Chem.MolFromSmiles(smiles2)
    
    if mol1 is None:
        return {"error": "Invalid SMILES string for first molecule"}
    if mol2 is None:
        return {"error": "Invalid SMILES string for second molecule"}
    
    # Generate Morgan fingerprints (ECFP4)
    fp1 = AllChem.GetMorganFingerprintAsBitVect(mol1, 2, nBits=2048)
    fp2 = AllChem.GetMorganFingerprintAsBitVect(mol2, 2, nBits=2048)
    
    # Calculate similarity based on method
    if method == 'tanimoto':
        similarity = float(DataStructs.TanimotoSimilarity(fp1, fp2))
    elif method == 'dice':
        similarity = float(DataStructs.DiceSimilarity(fp1, fp2))
    elif method == 'cosine':
        similarity = float(DataStructs.CosineSimilarity(fp1, fp2))
    else:
        similarity = float(DataStructs.TanimotoSimilarity(fp1, fp2))
    
    # Calculate properties for both molecules
    props1 = calculate_descriptors(smiles1)
    props2 = calculate_descriptors(smiles2)
    
    # Find Maximum Common Substructure (MCS)
    mcs = rdFMCS.FindMCS([mol1, mol2])
    mcs_mol = Chem.MolFromSmarts(mcs.smartsString)
    
    result = {
        "similarity": {
            "method": method,
            "score": similarity
        },
        "molecule1": {
            "smiles": smiles1,
            "properties": props1
        },
        "molecule2": {
            "smiles": smiles2,
            "properties": props2
        },
        "mcs": {
            "smarts": mcs.smartsString,
            "num_atoms": mcs.numAtoms,
            "num_bonds": mcs.numBonds
        }
    }
    
    return result

def main():
    args = parse_args()
    
    if args.operation == 'compare':
        if not args.smiles1 or not args.smiles2:
            print(json.dumps({"error": "Two SMILES strings are required for comparison"}))
            sys.exit(1)
        result = compare_molecules(args.smiles1, args.smiles2, args.method)
    elif args.operation == 'validate':
        if not args.smiles1:
            print(json.dumps({"error": "SMILES string required for validation"}))
            sys.exit(1)
        result = validate_smiles(args.smiles1)
    elif args.operation == 'descriptors':
        if not args.smiles1:
            print(json.dumps({"error": "SMILES string required for descriptor calculation"}))
            sys.exit(1)
        result = calculate_descriptors(args.smiles1)
    elif args.operation == 'svg':
        if not args.smiles1:
            print(json.dumps({"error": "SMILES string required for SVG generation"}))
            sys.exit(1)
        result = generate_svg(args.smiles1)
    elif args.operation == 'optimize_3d':
        if not args.smiles1:
            print(json.dumps({"error": "SMILES string required for 3D optimization"}))
            sys.exit(1)
        result = optimize_3d(args.smiles1)
    elif args.operation == 'fingerprint':
        if not args.smiles1:
            print(json.dumps({"error": "SMILES string required for fingerprint generation"}))
            sys.exit(1)
        result = generate_fingerprint(args.smiles1)
    
    # Output the result
    if args.output == 'json':
        print(json.dumps(result))
    else:
        for key, value in result.items():
            print(f"{key}: {value}")

if __name__ == "__main__":
    main() 