import React, { useState } from 'react';
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: '1px solid #ccc',
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  itemDetails: {
    fontSize: 12,
    marginBottom: 3,
  },
  subItem: {
    marginLeft: 10,
  },
  subItemText: {
    fontSize: 12,
  }
});

// Documento PDF
const MyDocument = ({ clientes }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Clientes Filtrados</Text>
        {clientes.map((cliente, idx) => (
          <View key={idx} style={styles.item}>
            <Text style={styles.itemTitle}>Nombre: {cliente.Nombre}</Text>
            <Text style={styles.itemDetails}>Código del Cliente: {cliente.Codigo}</Text>
            <Text style={styles.itemDetails}>Dirección de Entrega: {cliente["Dir. Entrega"] || 'No especificada'}</Text>
            <Text style={styles.itemDetails}>Dirección de Visita: {cliente["Direccion de visita"] || 'No especificada'}</Text>
            {cliente.provincia === 'si' && (
              <Text style={styles.itemDetails}>Provincia: {cliente['nombre de provincia'] || 'Indique el nombre de la Provincia'}</Text>
            )}
            {cliente.caba === 'si' && (
              <Text style={styles.itemDetails}>Barrio: {cliente.barrio || 'Indique el nombre del Barrio'}</Text>
            )}
            <Text style={styles.itemDetails}>Zona: {cliente.zona || 'No especificada'}</Text>
            <Text style={styles.itemDetails}>Datos Adicionales: {cliente.DatosAd || 'No especificados'}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const ExportClientes = ({ clientes }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleGeneratePdf = () => {
    setIsLoaded(true);
  };

  const handleDownloadComplete = () => {
    // Simulamos la finalización de la descarga con un timeout
    setTimeout(() => {
      setIsLoaded(false);
    }, 3000); // 3 segundos después de iniciar la descarga
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(clientes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes Filtrados");
    XLSX.writeFile(workbook, "clientes_filtrados.xlsx");
  };

  return (
    <div>
      {!isLoaded ? (
        <>
          <Button variant="primary" onClick={handleGeneratePdf} className="me-2">
            Generar PDF
          </Button>
          <Button variant="success" onClick={handleExportToExcel}>
            Exportar a Excel
          </Button>
        </>
      ) : (
        <PDFDownloadLink document={<MyDocument clientes={clientes} />} fileName="clientes_filtrados.pdf">
          {({ loading }) => {
            if (!loading) {
              handleDownloadComplete();
            }
            return loading ? (
              <Button variant="secondary" disabled>
                Cargando documento...
              </Button>
            ) : (
              <Button variant="primary">
                Descargar PDF
              </Button>
            );
          }}
        </PDFDownloadLink>
      )}
    </div>
  );
};

export default ExportClientes;

