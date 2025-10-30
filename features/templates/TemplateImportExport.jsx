import { h, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import Button from "../../commons/components/Button.jsx";
import { showToast } from "../../commons/components/Toast.jsx";

export default function TemplateImportExport({ templates, onImportComplete }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  function handleExportClick() {
    setIsExporting(true);

    try {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        templates: templates,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `templates-export-${Date.now()}.json`;
      link.click();

      // URL.revokeObjectURL(url);

      showToast("Templates exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Failed to export templates");
    } finally {
      setIsExporting(false);
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importData = JSON.parse(event.target.result);

        const templatesToImport = importData.templates;

        for (const template of templatesToImport) {
          // Remove IDs to create new templates
          delete template.templateId;
          delete template.createdAt;
          delete template.updatedAt;
          delete template.usageCount;
          delete template.lastUsedAt;

          await ApiClient.createTemplate(template);
        }

        showToast(`Imported ${templatesToImport.length} templates`);
        onImportComplete();
      } catch (error) {
        console.error("Import error:", error);
        showToast("Failed to import templates");
      } finally {
        setIsImporting(false);
        // Reset file input
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  return (
    <div className="template-import-export">
      <h3>Import/Export Templates</h3>
      <div className="import-export-actions">
        <Button 
          variant="primary" 
          onClick={handleExportClick}
          disabled={isExporting || templates.length === 0}
        >
          {isExporting ? "Exporting..." : "Export Templates"}
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import Templates"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style="display: none;"
          onChange={handleFileChange}
        />
      </div>
      <p className="import-export-hint">
        Export your templates to backup or share them. Import templates from a JSON file.
      </p>
    </div>
  );
}

