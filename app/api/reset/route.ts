import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://ganeshvath:admin236484@cluster0.wdeughd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .catch((err) => console.error('MongoDB connection error:', err));

interface Participant {
  name: string;
  completedAt: Date | null;
}

const participantSchema = new mongoose.Schema<Participant>({
  name: { type: String, required: true },
  completedAt: { type: Date, default: null },
});

const Participant = mongoose.model<Participant>('Participant', participantSchema);

export async function DELETE() {
  try {
    await Participant.deleteMany({});
    return NextResponse.json({ message: 'Data reset' });
  } catch {
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 });
  }
}