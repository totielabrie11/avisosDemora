// src/component/Export.jsx

import React from 'react';
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Button } from 'react-bootstrap';

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
const MyDocument = ({ pedidos }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Pedidos Filtrados</Text>
        {pedidos.map((pedido, idx) => (
          <View key={idx} style={styles.item}>
            <Text style={styles.itemTitle}>Cliente: {pedido.Cliente}</Text>
            <Text style={styles.itemDetails}>Pedido interno: {pedido.Pedido}</Text>
            <Text style={styles.itemDetails}>Orden de Compra: {pedido.oc}</Text>
            <Text style={styles.itemDetails}>Fecha de carga: {pedido.Inicio}</Text>
            {pedido.Items.map((item, itemIdx) => (
              <View key={itemIdx} style={styles.subItem}>
                <Text style={styles.subItemText}>{item.Descripcion} - Cantidad: {item.Cantidad} - Vence: {item.Fecha_vencida}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const ExportPDF = ({ pedidos }) => (
  <PDFDownloadLink document={<MyDocument pedidos={pedidos} />} fileName="pedidos_filtrados.pdf">
    {({ loading }) =>
      loading ? (
        <Button variant="secondary" disabled>
          Cargando documento...
        </Button>
      ) : (
        <Button variant="primary">
          Descargar PDF
        </Button>
      )
    }
  </PDFDownloadLink>
);

export default ExportPDF;

