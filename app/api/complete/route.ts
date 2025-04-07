import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const { participantId } = await req.json();
    const participant = await Participant.findByIdAndUpdate(
      participantId,
      { completedAt: new Date() },
      { new: true }
    );
    return NextResponse.json(participant);
  } catch {
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
  }
}