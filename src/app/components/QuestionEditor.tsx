'use client';
import React, { useState } from 'react';
import { Question } from '../../types/crossword';

interface QuestionEditorProps {
    questions: Question[];
    onUpdateQuestions: (questions: Question[]) => void;
}

export default function QuestionEditor({ questions, onUpdateQuestions }: QuestionEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [editForm, setEditForm] = useState({ clue: '', answer: '' });

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setEditForm({ clue: question.clue, answer: question.answer });
    };

    const handleSave = () => {
        if (!editingQuestion) return;

        const updatedQuestions = questions.map(q =>
            q.id === editingQuestion.id
                ? { ...q, clue: editForm.clue, answer: editForm.answer.toUpperCase() }
                : q
        );

        onUpdateQuestions(updatedQuestions);
        setEditingQuestion(null);
        setEditForm({ clue: '', answer: '' });
    };

    const handleCancel = () => {
        setEditingQuestion(null);
        setEditForm({ clue: '', answer: '' });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-4 transition-colors"
            >
                {isOpen ? 'Tutup Editor' : 'Edit Pertanyaan'}
            </button>

            {isOpen && (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg">Editor Pertanyaan</h3>

                    {editingQuestion ? (
                        <div className="border rounded p-4 bg-gray-50">
                            <h4 className="font-semibold mb-2">Edit Soal #{editingQuestion.number}</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Petunjuk:</label>
                                    <textarea
                                        value={editForm.clue}
                                        onChange={(e) => setEditForm({ ...editForm, clue: e.target.value })}
                                        className="w-full border rounded px-3 py-2 resize-none"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Jawaban:</label>
                                    <input
                                        type="text"
                                        value={editForm.answer}
                                        onChange={(e) => setEditForm({ ...editForm, answer: e.target.value.toUpperCase() })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                                    >
                                        Simpan
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {questions.map(question => (
                                <div key={question.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                        <span className="font-medium">#{question.number}</span>
                                        <span className="ml-2 text-sm text-gray-600">
                                            ({question.direction === 'horizontal' ? 'Mendatar' : 'Menurun'})
                                        </span>
                                        <div className="text-sm">{question.clue}</div>
                                        <div className="text-xs text-gray-500">Jawaban: {question.answer}</div>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(question)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Edit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
