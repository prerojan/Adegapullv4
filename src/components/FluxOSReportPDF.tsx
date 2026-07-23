import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Create Styles conforming to FluxOS clean corporate aesthetic
const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  // Grand Header Banner
  headerContainer: {
    backgroundColor: '#0F172A', // Slate 900
    padding: 18,
    borderRadius: 8,
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#10B981', // Emerald 500 (FluxOS Accent)
  },
  headerLogo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: 'bold',
  },
  headerMeta: {
    fontSize: 8,
    color: '#94A3B8', // Slate 400
    marginTop: 2,
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },

  // KPI Metrics Area (Bento style highlight grid)
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Table Styles
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 22,
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    minHeight: 25,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 8,
    color: '#334155',
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 8,
  },

  // Alignment classes
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  textCenter: {
    textAlign: 'center',
  },

  // Footer branding card
  footerContainer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
  },
  footerBranding: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#475569',
  }
});

interface FluxOSReportPDFProps {
  title: string;
  headers: string[];
  rows: string[][];
  summaryData: { label: string; value: string }[];
}

export default function FluxOSReportPDF({
  title,
  headers,
  rows,
  summaryData,
}: FluxOSReportPDFProps) {
  // Format long texts or cut them beautifully
  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit - 3) + '...' : text;
  };

  return (
    <Document title={`Relatorio - ${title}`}>
      <Page size="A4" style={styles.page}>
        {/* Banner */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerLogo}>FLUXOS • BUSINESS INTELLIGENCE</Text>
          <Text style={styles.headerTitle}>{title.toUpperCase()}</Text>
          <Text style={styles.headerMeta}>
            Relatório de Auditoria Homologada — Gerado em: {new Date().toLocaleString('pt-BR')}
          </Text>
        </View>

        {/* KPIs Grid */}
        <Text style={styles.sectionTitle}>Indicadores Operacionais de Desempenho</Text>
        <View style={styles.kpiContainer}>
          {summaryData.map((item, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Data Grid */}
        <Text style={styles.sectionTitle}>Detalhamento Auditado</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            {headers.map((h, i) => (
              <Text 
                key={i} 
                style={[
                  styles.tableCell, 
                  styles.tableHeaderCell,
                  i === headers.length - 1 ? styles.textRight : styles.textLeft
                ]}
              >
                {h}
              </Text>
            ))}
          </View>

          {/* Rows */}
          {rows.map((row, rowIdx) => {
            const isAlt = rowIdx % 2 !== 0;
            return (
              <View 
                key={rowIdx} 
                style={[
                  styles.tableRow, 
                  { backgroundColor: isAlt ? '#F8FAFC' : '#FFFFFF' }
                ]}
              >
                {row.map((cell, cellIdx) => {
                  const isCurrency = cell.includes('R$') || cell.includes('%');
                  return (
                    <Text 
                      key={cellIdx} 
                      style={[
                        styles.tableCell,
                        cellIdx === row.length - 1 || isCurrency ? styles.textRight : styles.textLeft
                      ]}
                    >
                      {truncateText(cell, 35)}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Footnotes */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Documento eletrônico oficial gerado pelo ERP FluxOS. Proteção de dados e integridade contábil.
          </Text>
          <Text style={styles.footerBranding}>FLUXOS • GESTÃO INTELIGENTE</Text>
        </View>
      </Page>
    </Document>
  );
}
