import { useState, useCallback } from 'react';

export function useAppState() {
  const [step, setStep] = useState('upload'); // 'upload' | 'results'
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedDoc, setParsedDoc] = useState(null); // ParsedDocument | null
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [city, setCity] = useState('');
  const [sponsorGoals, setSponsorGoals] = useState('');
  const [sponsors, setSponsors] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null); // full analysis from Claude
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const goToResults = useCallback(() => {
    setError(null);
    setStep('results');
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setStep('upload');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    step,
    goToResults,
    goBack,
    fileContent, setFileContent,
    fileName, setFileName,
    parsedDoc, setParsedDoc,
    eventName, setEventName,
    eventType, setEventType,
    city, setCity,
    sponsorGoals, setSponsorGoals,
    sponsors, setSponsors,
    analysisResult, setAnalysisResult,
    loading, setLoading,
    error, setError,
    clearError,
  };
}
