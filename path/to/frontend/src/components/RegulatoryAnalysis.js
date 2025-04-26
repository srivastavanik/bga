import React, { useState } from 'react'
import { Spin, Alert, Button, Input, Checkbox } from 'antd'
import ReactMarkdown from 'react-markdown'
import regulatoryAPI from '../api/regulatory'

export default function RegulatoryAnalysis() {
  // --- state ---
  const [parameters, setParameters] = useState({
    smiles: '',
    drugClass: '',
    targetIndication: '',
    primaryMechanism: '',
    novelMechanism: false,
    orphanDrug: false,
    fastTrack: false,
  })
  const [analysisReportText, setAnalysisReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // --- handler ---
  const handleRunAnalysis = async () => {
    if (!parameters.smiles) {
      setError('Please draw or paste a SMILES string first.')
      return
    }

    setError(null)
    setLoading(true)
    setAnalysisReportText('')

    try {
      const reportObj = await regulatoryAPI.generateRegulatoryReport(parameters)

      const reportText = reportObj.data?.data?.regulatoryReport ?? ''
      console.log('Fetched report text:', reportText)
      setAnalysisReportText(reportText)

    } catch (err) {
      // fallback to any error message your backend stuck in regulatoryReport
      const backendError =
        err.response?.data?.data?.regulatoryReport ||
        err.response?.data?.error ||
        err.message ||
        'Failed to generate report'
      setError(backendError)
    } finally {
      setLoading(false)
    }
  }

  // --- render ---
  return (
    <div>
      <Input
        placeholder="SMILES"
        value={parameters.smiles}
        onChange={e => setParameters(p => ({ ...p, smiles: e.target.value }))}
      />
      {/* …other parameter inputs… */}
      <Button onClick={handleRunAnalysis} loading={loading}>
        Run Analysis
      </Button>

      {error && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          message={error}
          showIcon
        />
      )}

      <div style={{ flex: 2, background: '#fafafa', padding: 16 }}>
        {loading && <Spin />}

        {analysisReportText && (
          <ReactMarkdown>{analysisReportText}</ReactMarkdown>
        )}
        {!analysisReportText && !loading && (
          <p>Click "Generate Report" to see the analysis.</p>
        )}
      </div>
    </div>
  )
} 