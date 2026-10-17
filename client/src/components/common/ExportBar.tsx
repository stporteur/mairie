import Alert from './Alert';

interface ExportBarProps {
  error: string;
  exporting: boolean;
  disabled: boolean;
  label?: string;
  onExport: () => void;
}

function ExportBar({ error, exporting, disabled, label = 'Export', onExport }: ExportBarProps) {
  return (
    <div className="export-actions">
      {error ? <Alert role="alert">{error}</Alert> : null}
      <button className="primary-button export-button" type="button" onClick={onExport} disabled={disabled}>
        {exporting ? 'Export en cours…' : label}
      </button>
    </div>
  );
}

export default ExportBar;
