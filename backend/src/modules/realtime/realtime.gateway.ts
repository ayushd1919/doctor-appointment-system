import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;

  appointmentBooked(payload: { doctor_id: number; start_at: string; end_at: string }) {
    this.server.emit('APPOINTMENT_BOOKED', payload);
  }

  unavailabilityAdded(payload: { doctor_id: number; id: number; start_at: string; end_at: string }) {
    this.server.emit('UNAVAILABILITY_ADDED', payload);
  }

  unavailabilityDeleted(payload: { doctor_id: number; id: number }) {
    this.server.emit('UNAVAILABILITY_DELETED', payload);
  }
}
