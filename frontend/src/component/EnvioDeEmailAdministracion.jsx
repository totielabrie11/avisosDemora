import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const EnvioDeEmailAdministracion = ({ reclamo, token, onSaveEmail, fetchEmail }) => {
  const [email, setEmail] = useState('');
  const [deuda, setDeuda] = useState('');
  const [subject, setSubject] = useState('Deuda a revisar');
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getEmail = async () => {
      const clientEmail = await fetchEmail(reclamo.cliente);
      setEmail(clientEmail);
    };
    getEmail();
  }, [reclamo.cliente, fetchEmail]);

  useEffect(() => {
    setMessage(`Estimado cliente, al intentar liberar la mercancía para su despacho o que se encontraba en reclamo de liberación, identificamos una deuda pendiente. El plazo para recibir una confirmación, envío de orden de pago y retenciones correspondientes, es de 72 horas hábiles, bajo perjuicio de perder la asignación de mercancías destinadas hacia Usted. Y en los casos que tuviera iniciado un reclamo por, fecha pendiente de entrega, se procederá a dar de baja dicho reclamo.`);
  }, []);

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/v1/sendEmail', {
        to: email,
        subject,
        text: `${message}\n\nMonto de la deuda: ${deuda}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSaveEmail(email);
      alert('Correo enviado exitosamente');
      setShow(false);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error enviando el correo. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="info" onClick={() => setShow(true)}>
        Enviar Correo
      </Button>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enviar Correo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="email">
              <Form.Label>Correo del Cliente</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="deuda">
              <Form.Label>Ingrese monto de la deuda</Form.Label>
              <Form.Control
                type="number"
                value={deuda}
                onChange={(e) => setDeuda(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="subject">
              <Form.Label>Asunto</Form.Label>
              <Form.Control
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled
              />
            </Form.Group>
            <Form.Group controlId="message">
              <Form.Label>Mensaje</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleSendEmail} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Correo'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnvioDeEmailAdministracion;
