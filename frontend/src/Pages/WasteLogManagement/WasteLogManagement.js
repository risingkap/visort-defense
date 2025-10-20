// WasteLogManagement.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import WasteCategoryCard from './WasteCategoryCard';
import './WasteLogManagement.css';

function WasteLogManagement() {
  const chartRef = useRef(null);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  // Tabs removed – single combined chart view
  const [wasteData, setWasteData] = useState([
    {
      category: 'Hazardous Waste',
      color: 'red',
      dataPoints: [],
    },
    {
      category: 'Non-Hazardous Waste',
      color: 'green',
      dataPoints: [],
    },
  ]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
        // Use the statistics endpoint for accurate counts
        const response = await fetch(`${base}/api/waste/stats/summary?days=30`);
        const json = await response.json();
        if (!response.ok) throw new Error('Failed to fetch statistics');

        const hazardousTotal = json?.data?.hazardous || 0;
        const nonHazTotal = json?.data?.nonHazardous || 0;

        setWasteData([
          { category: 'Hazardous Waste', color: 'red', dataPoints: [{ month: 'Total', value: hazardousTotal }] },
          { category: 'Non-Hazardous Waste', color: 'green', dataPoints: [{ month: 'Total', value: nonHazTotal }] },
        ]);
      } catch (e) {
        setWasteData([
          { category: 'Hazardous Waste', color: 'red', dataPoints: [] },
          { category: 'Non-Hazardous Waste', color: 'green', dataPoints: [] },
        ]);
      }
    };
    fetchCounts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPdfOptions && !event.target.closest('.relative')) {
        setShowPdfOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPdfOptions]);

  // Helper removed (no longer used)

  const { hazardousTotal, nonHazTotal, grandTotal } = useMemo(() => {
    const hazardous = wasteData[0]?.dataPoints?.[0]?.value || 0;
    const nonHazardous = wasteData[1]?.dataPoints?.[0]?.value || 0;
    const total = hazardous + nonHazardous;
    return { hazardousTotal: hazardous, nonHazTotal: nonHazardous, grandTotal: total };
  }, [wasteData]);

  const analysisText = useMemo(() => {
    if (grandTotal === 0) {
      return 'No disposal records are available yet. Once data is collected, this section will summarize the distribution between hazardous and non-hazardous waste and highlight notable imbalances.';
    }
    const hazPct = ((hazardousTotal / grandTotal) * 100).toFixed(1);
    const nonHazPct = ((nonHazTotal / grandTotal) * 100).toFixed(1);
    const trend = hazardousTotal > nonHazTotal
      ? 'Hazardous waste currently exceeds non-hazardous waste, which may require stricter handling protocols and targeted reduction efforts.'
      : hazardousTotal < nonHazTotal
        ? 'Non-hazardous waste dominates disposal activity; consider opportunities to reduce, reuse, or recycle to further decrease this volume.'
        : 'Hazardous and non-hazardous waste are balanced at present; continue monitoring for shifts in composition.';
    return (
      `Overview\n` +
      `- Total disposals: ${grandTotal}\n` +
      `- Hazardous: ${hazardousTotal} (${hazPct}%)\n` +
      `- Non-Hazardous: ${nonHazTotal} (${nonHazPct}%)\n\n` +
      `Insights\n` +
      `- ${trend}\n` +
      `- Track changes over time to identify spikes and evaluate interventions.\n`
    );
  }, [grandTotal, hazardousTotal, nonHazTotal]);

  const generatePdf = useCallback(() => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    let cursorY = margin;

    // Header with logo and title
    doc.setFillColor(34, 197, 94); // Green background
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('ViSORT Waste Management Analysis Report', margin, 35);
    
    // Subtitle
    doc.setFontSize(12);
    doc.text('Comprehensive Waste Disposal Analysis & Insights', margin, 55);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    cursorY = 100;

    // Report metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, cursorY);
    doc.text(`Report Period: ${new Date().toLocaleDateString()}`, margin, cursorY + 12);
    doc.text(`Bin ID: ESP32CAM-01`, margin, cursorY + 24);
    cursorY += 50;

    // Executive Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Executive Summary', margin, cursorY);
    cursorY += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const summaryText = `This comprehensive analysis provides detailed insights into waste disposal patterns for the ESP32CAM-01 bin system. The report covers total waste volume, categorization breakdown, and operational recommendations based on current disposal trends.`;
    const summaryLines = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
    doc.text(summaryLines, margin, cursorY);
    cursorY += summaryLines.length * 12 + 20;

    // Key Statistics Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Key Statistics', margin, cursorY);
    cursorY += 20;

    // Statistics table
    const statsData = [
      ['Metric', 'Value', 'Percentage'],
      ['Total Disposals', grandTotal.toString(), '100%'],
      ['Hazardous Waste', hazardousTotal.toString(), `${((hazardousTotal / grandTotal) * 100).toFixed(1)}%`],
      ['Non-Hazardous Waste', nonHazTotal.toString(), `${((nonHazTotal / grandTotal) * 100).toFixed(1)}%`],
      ['Hazardous Ratio', `${((hazardousTotal / grandTotal) * 100).toFixed(1)}%`, 'Risk Level: ' + (hazardousTotal > nonHazTotal ? 'HIGH' : 'LOW')]
    ];

    autoTable(doc, {
      head: [statsData[0]],
      body: statsData.slice(1),
      startY: cursorY,
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
    cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : cursorY + 100;

    // Chart image (if available)
    try {
      const chartInstance = chartRef.current;
      const dataUrl = chartInstance?.toBase64Image
        ? chartInstance.toBase64Image()
        : chartInstance?.canvas?.toDataURL?.('image/png');
      if (dataUrl) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Visual Analysis', margin, cursorY);
        cursorY += 20;

        const imgMaxWidth = pageWidth - margin * 2;
        const canvasWidth = chartInstance?.canvas?.width || imgMaxWidth;
        const canvasHeight = chartInstance?.canvas?.height || 300;
        const scale = imgMaxWidth / canvasWidth;
        const imgWidth = imgMaxWidth;
        const imgHeight = canvasHeight * scale;
        
        doc.addImage(dataUrl, 'PNG', margin, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 20;
      }
    } catch (e) {
      console.log('Chart image not available for PDF');
    }

    // Detailed Analysis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detailed Analysis', margin, cursorY);
    cursorY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const detailedAnalysis = `WASTE DISPOSAL ANALYSIS REPORT

DISPOSAL OVERVIEW:
The ESP32CAM-01 bin system has processed a total of ${grandTotal} waste disposals. This comprehensive dataset provides valuable insights into waste management patterns and operational efficiency.

HAZARDOUS WASTE ANALYSIS:
• Total Hazardous Disposals: ${hazardousTotal} items
• Percentage of Total: ${((hazardousTotal / grandTotal) * 100).toFixed(1)}%
• Risk Assessment: ${hazardousTotal > nonHazTotal ? 'HIGH RISK - Hazardous waste exceeds non-hazardous' : 'LOW RISK - Non-hazardous waste dominates'}
• Compliance Status: ${hazardousTotal > 0 ? 'REQUIRES ATTENTION - Hazardous materials detected' : 'COMPLIANT - No hazardous materials'}

NON-HAZARDOUS WASTE ANALYSIS:
• Total Non-Hazardous Disposals: ${nonHazTotal} items
• Percentage of Total: ${((nonHazTotal / grandTotal) * 100).toFixed(1)}%
• Efficiency Rating: ${nonHazTotal > hazardousTotal ? 'HIGH - Proper waste segregation' : 'MODERATE - Mixed waste patterns detected'}

OPERATIONAL INSIGHTS:
• Waste Segregation Efficiency: ${((nonHazTotal / grandTotal) * 100).toFixed(1)}% non-hazardous
• System Utilization: ${grandTotal > 0 ? 'ACTIVE - Regular disposal activity' : 'INACTIVE - No recent disposals'}
• Maintenance Requirements: ${hazardousTotal > 0 ? 'HIGH - Hazardous waste handling required' : 'STANDARD - Routine maintenance sufficient'}

RECOMMENDATIONS:
${hazardousTotal > nonHazTotal ? 
  '1. IMMEDIATE ACTION REQUIRED: Implement enhanced hazardous waste protocols\n2. Staff training on hazardous material identification\n3. Review disposal procedures and safety measures\n4. Consider additional safety equipment and protocols' :
  '1. MAINTAIN CURRENT PROTOCOLS: System operating within acceptable parameters\n2. Continue regular monitoring and maintenance\n3. Periodic review of disposal procedures\n4. Staff training updates as needed'}

COMPLIANCE STATUS:
• Environmental Compliance: ${hazardousTotal > 0 ? 'REVIEW REQUIRED' : 'COMPLIANT'}
• Safety Protocols: ${hazardousTotal > 0 ? 'ENHANCED MONITORING NEEDED' : 'STANDARD PROTOCOLS SUFFICIENT'}
• Documentation: COMPLETE - All disposals properly recorded

NEXT STEPS:
1. Review this analysis with the waste management team
2. Implement recommended safety measures if applicable
3. Schedule regular system maintenance
4. Update disposal procedures based on findings
5. Conduct follow-up analysis in 30 days

This report provides a comprehensive overview of waste disposal activities and serves as a foundation for continuous improvement in waste management practices.`;

    const analysisLines = doc.splitTextToSize(detailedAnalysis, pageWidth - margin * 2);
    
    // Check if we need a new page
    if (cursorY + (analysisLines.length * 10) > pageHeight - 100) {
      doc.addPage();
      cursorY = margin;
    }
    
    doc.text(analysisLines, margin, cursorY);

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 100, pageHeight - 20);
      doc.text('ViSORT Waste Management System', margin, pageHeight - 20);
    }

    return doc;
  }, [analysisText, grandTotal, hazardousTotal, nonHazTotal]);

  const handleDownloadPdf = useCallback(async () => {
    const doc = generatePdf();
    doc.save(`waste-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowPdfOptions(false);
  }, [generatePdf]);

  const handleViewPdf = useCallback(async () => {
    const doc = generatePdf();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    setShowPdfOptions(false);
  }, [generatePdf]);

  return (
    <div className="waste-log-management-container">
      <div className="waste-header">
        <h2 className="waste-log-management-title">WASTE CHART</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPdfOptions(!showPdfOptions)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#294B29] hover:bg-[#1a3a1a] focus:outline-none"
          >
            PDF Analysis
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showPdfOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={handleViewPdf}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View PDF
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="waste-cards-grid">
        <WasteCategoryCard
          key="combined-bars"
          category="Waste Chart (Hazardous vs Non-Hazardous)"
          color="#e5e7eb"
          chartRef={chartRef}
          labels={["Hazardous", "Non-Hazardous"]}
          series={[
            {
              label: 'Hazardous',
              data: [
                wasteData[0]?.dataPoints?.[0]?.value || 0,
                0
              ],
              color: { bg: 'rgba(220, 38, 38, 0.7)', border: 'rgba(185, 28, 28, 1)' },
            },
            {
              label: 'Non-Hazardous',
              data: [
                0,
                wasteData[1]?.dataPoints?.[0]?.value || 0
              ],
              color: { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgba(21, 128, 61, 1)' },
            }
          ]}
        />
      </div>
      <div className="waste-analysis mt-2 p-2 bg-gradient-to-br from-white to-gray-50 rounded-md shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-1">
          <div className="h-5 w-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-sm flex items-center justify-center">
            <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-gray-900">Descriptive Analysis</h3>
        </div>
        <div className="bg-white rounded-md p-1.5 border border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center py-0.5 px-1.5 bg-gray-50 rounded border-b border-gray-200">
                <span className="font-semibold text-gray-700 text-xs">Total</span>
                <span className="font-bold text-blue-600 text-xs">{grandTotal}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 px-1.5 bg-gray-50 rounded border-b border-gray-200">
                <span className="font-semibold text-gray-700 text-xs">Hazardous</span>
                <span className="font-bold text-red-600 text-xs">
                  {hazardousTotal} ({grandTotal > 0 ? ((hazardousTotal / grandTotal) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-0.5 px-1.5 bg-gray-50 rounded border-b border-gray-200">
                <span className="font-semibold text-gray-700 text-xs">Non-Haz</span>
                <span className="font-bold text-green-600 text-xs">
                  {nonHazTotal} ({grandTotal > 0 ? ((nonHazTotal / grandTotal) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 px-1.5 bg-gray-50 rounded border-b border-gray-200">
                <span className="font-semibold text-gray-700 text-xs">Balance</span>
                <span className="font-bold text-purple-600 text-xs">
                  {grandTotal === 0 
                    ? 'No Data'
                    : hazardousTotal > nonHazTotal
                      ? 'Haz >'
                      : hazardousTotal < nonHazTotal
                        ? 'Non >'
                        : 'Balanced'
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="mt-1.5 p-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded border border-gray-200">
            <div className="text-xs text-gray-600 leading-tight">
              <span className="font-semibold text-gray-700">Analysis:</span> 
              <span className="ml-1">
                {grandTotal === 0 
                  ? 'No records yet.'
                  : hazardousTotal > nonHazTotal
                    ? 'Hazardous exceeds.'
                    : hazardousTotal < nonHazTotal
                      ? 'Non-hazardous dominates.'
                      : 'Waste types balanced.'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WasteLogManagement;
