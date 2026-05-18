'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Code, Play, Plus, Trash2 } from 'lucide-react';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  starterCode: string;
  testCases: TestCase[];
  constraints: string[];
}

interface CodingQuestionEditorProps {
  onSave: (question: CodingQuestion) => void;
  onCancel: () => void;
  initialData?: CodingQuestion;
}

export default function CodingQuestionEditor({
  onSave,
  onCancel,
  initialData,
}: CodingQuestionEditorProps) {
  const [formData, setFormData] = useState<CodingQuestion>(
    initialData || {
      id: `coding_${Date.now()}`,
      title: '',
      description: '',
      marks: 10,
      difficulty: 'medium',
      language: 'javascript',
      starterCode: '',
      testCases: [],
      constraints: [],
    }
  );

  const [newConstraint, setNewConstraint] = useState('');

  const handleAddTestCase = () => {
    const newTestCase: TestCase = {
      id: `tc_${Date.now()}`,
      input: '',
      expectedOutput: '',
      isHidden: false,
    };
    setFormData({
      ...formData,
      testCases: [...formData.testCases, newTestCase],
    });
  };

  const handleUpdateTestCase = (id: string, field: keyof TestCase, value: any) => {
    setFormData({
      ...formData,
      testCases: formData.testCases.map((tc) =>
        tc.id === id ? { ...tc, [field]: value } : tc
      ),
    });
  };

  const handleDeleteTestCase = (id: string) => {
    setFormData({
      ...formData,
      testCases: formData.testCases.filter((tc) => tc.id !== id),
    });
  };

  const handleAddConstraint = () => {
    if (newConstraint.trim()) {
      setFormData({
        ...formData,
        constraints: [...formData.constraints, newConstraint.trim()],
      });
      setNewConstraint('');
    }
  };

  const handleDeleteConstraint = (index: number) => {
    setFormData({
      ...formData,
      constraints: formData.constraints.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description');
      return;
    }
    if (formData.testCases.length === 0) {
      alert('Please add at least one test case');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* LEFT SIDE - Question Details */}
      <div className="space-y-4 overflow-y-auto pr-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Question Details
            </CardTitle>
            <CardDescription>Define the coding problem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Implement Binary Search"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Problem Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the problem, input format, output format, and examples..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Marks, Difficulty, Language */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="marks">Marks *</Label>
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  value={formData.marks}
                  onChange={(e) =>
                    setFormData({ ...formData, marks: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <Label>Constraints</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 1 <= arr.length <= 10^4"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddConstraint()}
                />
                <Button type="button" onClick={handleAddConstraint} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.constraints.length > 0 && (
                <div className="space-y-1 mt-2">
                  {formData.constraints.map((constraint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <span className="font-mono">{constraint}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConstraint(index)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Cases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Test Cases *</Label>
                <Button type="button" onClick={handleAddTestCase} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Test Case
                </Button>
              </div>

              {formData.testCases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No test cases added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.testCases.map((tc, index) => (
                    <Card key={tc.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Test Case {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.isHidden}
                                onChange={(e) =>
                                  handleUpdateTestCase(tc.id, 'isHidden', e.target.checked)
                                }
                              />
                              Hidden
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTestCase(tc.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Input (e.g., [1, 2, 3], 2)"
                            value={tc.input}
                            onChange={(e) => handleUpdateTestCase(tc.id, 'input', e.target.value)}
                            className="font-mono text-sm"
                          />
                          <Input
                            placeholder="Expected Output (e.g., 1)"
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              handleUpdateTestCase(tc.id, 'expectedOutput', e.target.value)
                            }
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SIDE - Code Editor */}
      <div className="space-y-4 overflow-y-auto">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Starter Code
            </CardTitle>
            <CardDescription>
              Provide initial code template for students (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea
              placeholder={getStarterCodePlaceholder(formData.language)}
              value={formData.starterCode}
              onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
              className="flex-1 font-mono text-sm resize-none min-h-[400px]"
              style={{
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                tabSize: 2,
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                Save Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStarterCodePlaceholder(language: string): string {
  const placeholders: Record<string, string> = {
    javascript: `function solution(arr, target) {
  // Your code here
  
}`,
    python: `def solution(arr, target):
    # Your code here
    pass`,
    java: `public class Solution {
    public int solution(int[] arr, int target) {
        // Your code here
        
    }
}`,
    cpp: `class Solution {
public:
    int solution(vector<int>& arr, int target) {
        // Your code here
        
    }
};`,
    typescript: `function solution(arr: number[], target: number): number {
  // Your code here
  
}`,
  };

  return placeholders[language] || placeholders.javascript;
}
