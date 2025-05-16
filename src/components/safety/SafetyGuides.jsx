import React, { useState } from 'react';
import { FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import './SafetyGuides.css';

const safetyGuides = {
  earthquake: {
    title: 'Earthquake Safety',
    beforeDisaster: [
      'Identify safe spots in each room (under sturdy tables, against interior walls)',
      'Secure heavy furniture and hanging objects',
      'Keep emergency supplies ready',
      'Know how to turn off gas, water, and electricity'
    ],
    duringDisaster: [
      'DROP to the ground',
      'COVER by getting under a sturdy desk or table',
      'HOLD ON until the shaking stops',
      'Stay away from windows and exterior walls',
      'If in bed, stay there and protect your head with a pillow'
    ],
    afterDisaster: [
      'Check for injuries and provide first aid',
      'Listen to emergency radio for instructions',
      'Expect aftershocks',
      'Check for gas leaks and fire hazards',
      'Stay out of damaged buildings'
    ]
  },
  flood: {
    title: 'Flood Safety',
    beforeDisaster: [
      'Know your area\'s flood risk',
      'Prepare an emergency kit',
      'Plan evacuation routes',
      'Keep important documents waterproof'
    ],
    duringDisaster: [
      'Move to higher ground immediately',
      'Never walk or drive through flood waters',
      'Stay away from power lines and electrical wires',
      'Listen to official instructions'
    ],
    afterDisaster: [
      'Avoid flood waters - they may be contaminated',
      'Document damage for insurance',
      'Clean and disinfect everything that got wet',
      'Watch for updates from authorities'
    ]
  },
  fire: {
    title: 'Fire Safety',
    beforeDisaster: [
      'Install smoke alarms on every level',
      'Create and practice a fire escape plan',
      'Keep fire extinguishers accessible',
      'Clear area around house of flammable materials'
    ],
    duringDisaster: [
      'Get out immediately - every second counts',
      'Crawl low under smoke',
      'Test doors for heat before opening',
      'Meet at designated meeting place outside'
    ],
    afterDisaster: [
      'Don\'t return until authorities say it\'s safe',
      'Document damage',
      'Contact insurance company',
      'Get professional inspection before reconnecting utilities'
    ]
  },
  cyclone: {
    title: 'Cyclone Safety',
    beforeDisaster: [
      'Board up windows and secure loose items',
      'Fill vehicles with fuel',
      'Stock up on emergency supplies',
      'Know your evacuation route'
    ],
    duringDisaster: [
      'Stay indoors away from windows',
      'Listen to official instructions',
      'Keep emergency kit handy',
      'If evacuating, leave early'
    ],
    afterDisaster: [
      'Stay inside until all-clear is given',
      'Watch for downed power lines',
      'Avoid flood waters',
      'Document damage for insurance'
    ]
  },
  tsunami: {
    title: 'Tsunami Safety',
    beforeDisaster: [
      'Know tsunami warning signs',
      'Learn evacuation routes to high ground',
      'Prepare emergency kit',
      'Practice evacuation plans'
    ],
    duringDisaster: [
      'Move immediately to high ground',
      'Follow evacuation orders immediately',
      'Don\'t wait for official warning if you feel strong earthquake',
      'Stay away from coast'
    ],
    afterDisaster: [
      'Stay away until officials give all-clear',
      'Stay out of debris-filled water',
      'Help injured people',
      'Listen for updates'
    ]
  },
  tornado: {
    title: 'Tornado Safety',
    beforeDisaster: [
      'Identify safe room or basement',
      'Practice tornado drills',
      'Keep emergency supplies ready',
      'Know warning signs'
    ],
    duringDisaster: [
      'Go to basement or interior room on lowest floor',
      'Stay away from windows and outside walls',
      'Get under sturdy protection',
      'If in mobile home, get out and find sturdy shelter'
    ],
    afterDisaster: [
      'Stay in shelter until all-clear',
      'Watch for downed power lines',
      'Help injured people',
      'Document damage'
    ]
  }
};

function SafetyGuides() {
  const [selectedDisaster, setSelectedDisaster] = useState('earthquake');
  const [activePhase, setActivePhase] = useState('beforeDisaster');

  const phases = {
    beforeDisaster: 'Before Disaster',
    duringDisaster: 'During Disaster',
    afterDisaster: 'After Disaster'
  };

  return (
    <div className="safety-guides">
      <header className="safety-header">
        <h1><FaExclamationTriangle /> Safety Guidelines</h1>
        <p>Essential safety measures for different types of disasters</p>
      </header>

      <div className="disaster-selector">
        {Object.keys(safetyGuides).map(type => (
          <button
            key={type}
            className={`disaster-type-btn ${selectedDisaster === type ? 'active' : ''}`}
            onClick={() => setSelectedDisaster(type)}
          >
            {safetyGuides[type].title}
          </button>
        ))}
      </div>

      <div className="safety-content">
        <div className="phase-selector">
          {Object.entries(phases).map(([phase, label], index) => (
            <React.Fragment key={phase}>
              <button
                className={`phase-btn ${activePhase === phase ? 'active' : ''}`}
                onClick={() => setActivePhase(phase)}
              >
                {label}
              </button>
              {index < Object.keys(phases).length - 1 && <FaArrowRight className="arrow-icon" />}
            </React.Fragment>
          ))}
        </div>

        <div className="safety-instructions">
          <h2>{phases[activePhase]}</h2>
          <ul className="instruction-list">
            {safetyGuides[selectedDisaster][activePhase].map((instruction, index) => (
              <li key={index} className="instruction-item">
                {instruction}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SafetyGuides;