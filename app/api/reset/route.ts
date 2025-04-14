import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://ganeshvath:admin236484@cluster0.wdeughd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

interface Participant {
  name: string;
  completedAt: Date | null;
}

const participantSchema = new mongoose.Schema<Participant>({
  name: { type: String, required: true },
  completedAt: { type: Date, default: null },
});

// Check if the model is already registered to prevent OverwriteModelError
const Participant = mongoose.models.Participant || mongoose.model<Participant>('Participant', participantSchema);

export async function DELETE() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
    }
    
    await Participant.deleteMany({});
    
    return NextResponse.json({ message: 'Data reset' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 });
  } finally {
    // Close the connection if it was opened in this request
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}