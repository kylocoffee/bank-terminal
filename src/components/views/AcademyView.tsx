import React, { useState } from 'react';
import { TECHNICAL_SPECIFICATIONS } from '../../data/academyData';
import { terminalSound } from '../../utils/soundEffects';

export const AcademyView: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    TECHNICAL_SPECIFICATIONS[0].id
  );

  const activeTopic =
    TECHNICAL_SPECIFICATIONS.find((t) => t.id === selectedTopicId) ||
    TECHNICAL_SPECIFICATIONS[0];

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            INTERBANK OPERATING STANDARDS & PROTOCOL SPECIFICATIONS
          </span>
          <span className="text-xs">TECHNICAL MANUAL & CORE SYSTEM ARCHITECTURE</span>
        </div>
        <span className="border border-[#00ff00] px-2 py-0.5">DOC-SPEC-2026</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Topic Index Sidebar */}
        <div className="lg:col-span-4 border border-[#00ff00] p-3 space-y-2">
          <div className="font-bold pb-1 border-b border-[#00ff00] mb-2">
            INDEX OF SPECIFICATIONS:
          </div>

          <div className="space-y-1.5">
            {TECHNICAL_SPECIFICATIONS.map((topic) => {
              const isSelected = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    terminalSound.keyPress();
                    setSelectedTopicId(topic.id);
                  }}
                  className={`w-full text-left p-2 border cursor-pointer transition-none ${
                    isSelected
                      ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                      : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                  }`}
                >
                  <div className="text-[10px] opacity-80">[{topic.category}]</div>
                  <div className="font-bold text-[11px] leading-tight mt-0.5">
                    {topic.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic Content Body */}
        <div className="lg:col-span-8 border border-[#00ff00] p-4 space-y-4">
          <div className="border-b border-[#00ff00] pb-2">
            <div className="text-[10px] opacity-75">SPECIFICATION: {activeTopic.id}</div>
            <h1 className="text-sm font-bold mt-0.5">{activeTopic.title}</h1>
            <div className="text-[11px] opacity-90 mt-1">{activeTopic.subtitle}</div>
          </div>

          <div className="border border-[#00ff00] p-3 bg-black">
            <span className="font-bold">EXECUTIVE SUMMARY: </span>
            {activeTopic.summary}
          </div>

          <div className="space-y-4">
            {activeTopic.sections.map((sec, idx) => (
              <div key={idx} className="border-t border-[#00ff00] pt-3">
                <h2 className="font-bold text-xs mb-1.5">{sec.heading}</h2>
                <div className="text-xs leading-relaxed whitespace-pre-wrap opacity-95">
                  {sec.body}
                </div>

                {sec.codeSnippet && (
                  <pre className="mt-2 bg-black border border-[#00ff00] p-3 text-[11px] text-[#00ff00] overflow-x-auto leading-tight font-mono">
                    {sec.codeSnippet}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
