import React from 'react';
import { useTranslation } from 'react-i18next';
import './Emergency.css';

function Emergency() {
  const { t } = useTranslation();

  const emergencyContacts = [
    { name: 'National Emergency Number', number: '112' },
    { name: 'Police', number: '100' },
    { name: 'Fire', number: '101' },
    { name: 'Ambulance', number: '102' },
    { name: 'Disaster Management', number: '108' },
  ];

  const rescueTeams = [
    { id: 1, name: 'Team Alpha', location: 'Mumbai', status: 'Active', members: 12 },
    { id: 2, name: 'Team Beta', location: 'Delhi', status: 'On Mission', members: 8 },
    { id: 3, name: 'Team Gamma', location: 'Chennai', status: 'Standby', members: 10 },
  ];

  return (
    <div className="emergency-page">
      <h1>{t('Emergency Contacts')}</h1>
      
      <section className="emergency-contacts">
        <h2>{t('Important Numbers')}</h2>
        <div className="contacts-grid">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className="contact-card">
              <h3>{t(contact.name)}</h3>
              <p className="phone-number">{contact.number}</p>
              <a href={`tel:${contact.number}`} className="call-btn" target="_self">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: '8px'}}>
                  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                </svg>
                Call Now
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="rescue-teams">
        <h2>{t('Active Rescue Teams')}</h2>
        <div className="teams-table">
          <table>
            <thead>
              <tr>
                <th>{t('Team Name')}</th>
                <th>{t('Location')}</th>
                <th>{t('Status')}</th>
                <th>{t('Team Members')}</th>
              </tr>
            </thead>
            <tbody>
              {rescueTeams.map(team => (
                <tr key={team.id}>
                  <td>{team.name}</td>
                  <td>{team.location}</td>
                  <td className={`status ${team.status.toLowerCase()}`}>{team.status}</td>
                  <td>{team.members}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Emergency;