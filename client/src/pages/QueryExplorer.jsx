import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchQueries, runQuery } from '../api';
import { TableSkeleton } from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import { Code2, Play, Copy, CheckCheck, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import sqlLanguage from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
SyntaxHighlighter.registerLanguage('sql', sqlLanguage);
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../context/ThemeContext';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn-icon" title="Copy SQL">
      {copied ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function QueryCard({ query }) {
  const { dark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setRunning(true);
    setErr(null);
    try {
      const res = await runQuery(query.id);
      setResult(res.rows);
      setExpanded(true);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message);
    } finally {
      setRunning(false);
    }
  };

  const columns = result?.[0] ? Object.keys(result[0]) : [];

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            Q{query.id}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{query.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{query.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <CopyButton text={query.sql} />
          <button
            onClick={run}
            disabled={running}
            className="btn-primary text-xs py-1.5 px-3"
            title="Run query"
          >
            {running ? <span className="animate-spin">⟳</span> : <Play size={12} />}
            {running ? 'Running…' : 'Run'}
          </button>
          <button onClick={() => setExpanded(e => !e)} className="btn-icon">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* SQL Block */}
      <div className="text-sm font-mono">
        <SyntaxHighlighter
          language="sql"
          style={dark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '12.5px',
            padding: '16px 20px',
            background: dark ? '#0f172a' : '#f8fafc',
          }}
        >
          {query.sql}
        </SyntaxHighlighter>
      </div>

      {/* Results */}
      {err && (
        <div className="px-5 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><Terminal size={11} /> {err}</p>
        </div>
      )}

      {result && expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700/50">
          <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <Terminal size={12} className="text-slate-400" />
            <span className="text-xs text-slate-500">{result.length} row{result.length !== 1 ? 's' : ''} returned</span>
          </div>
          {result.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400">No rows returned.</p>
          ) : (
            <div className="table-wrapper rounded-none">
              <table className="table">
                <thead>
                  <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {result.map((row, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col} className="font-mono text-xs">{row[col] == null ? <span className="text-slate-400">NULL</span> : String(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QueryExplorer() {
  const { data, loading, error } = useAsync(fetchQueries);


  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 size={22} /> SQL Query Explorer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          All 10 predefined queries — click <strong>Run</strong> to execute against the live data
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-5"><TableSkeleton rows={3} /></div>)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.map(q => <QueryCard key={q.id} query={q} />)}
        </div>
      )}
    </div>
  );
}
