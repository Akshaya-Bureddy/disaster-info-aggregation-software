import React from 'react';
import './Categories.css';

function Categories() {
  return (
    <div className="categories-container">
      <h2>Emergency Response & Contacts</h2>
      
      <div className="emergency-contacts">
        <h3>Emergency Helpline Numbers</h3>
        <div className="contact-grid">
          <div className="contact-card">
            <i className="fas fa-phone contact-icon"></i>
            <h4>National Emergency</h4>
            <a href="tel:112">112</a>
          </div>
          <div className="contact-card">
            <i className="fas fa-ambulance contact-icon"></i>
            <h4>Ambulance</h4>
            <a href="tel:108">108</a>
          </div>
          <div className="contact-card">
            <i className="fas fa-shield-alt contact-icon"></i>
            <h4>Police</h4>
            <a href="tel:100">100</a>
          </div>
          <div className="contact-card">
            <i className="fas fa-fire-extinguisher contact-icon"></i>
            <h4>Fire & Rescue</h4>
            <a href="tel:101">101</a>
          </div>
        </div>
      </div>

      <div className="categories-grid">
        <div className="category-card">
          <h3>Government Teams</h3>
          <ul>
            <li>NDRF: <a href="tel:011-24363260">011-24363260</a></li>
            <li>SDRF Control Room: <a href="tel:1070">1070</a></li>
            <li>Fire & Emergency: <a href="tel:101">101</a></li>
            <li>Civil Defense: <a href="tel:011-23438091">011-23438091</a></li>
          </ul>
        </div>
        <div className="category-card">
          <h3>Medical Response</h3>
          <ul>
            <li>Emergency Medical: <a href="tel:108">108</a></li>
            <li>Blood Bank: <a href="tel:1910">1910</a></li>
            <li>Poison Control: <a href="tel:1066">1066</a></li>
            <li>Covid Helpline: <a href="tel:1075">1075</a></li>
          </ul>
        </div>
        <div className="category-card">
          <h3>Specialized Units</h3>
          <ul>
            <li>Search & Rescue: <a href="tel:011-24363260">011-24363260</a></li>
            <li>Coast Guard: <a href="tel:1554">1554</a></li>
            <li>Railway Alert: <a href="tel:1512">1512</a></li>
            <li>Air Ambulance: <a href="tel:9540161344">9540161344</a></li>
          </ul>
        </div>
        <div className="category-card">
          <h3>Support Organizations</h3>
          <ul>
            <li>Red Cross: <a href="tel:011-23359379">011-23359379</a></li>
            <li>Women Helpline: <a href="tel:1091">1091</a></li>
            <li>Child Helpline: <a href="tel:1098">1098</a></li>
            <li>Senior Citizen: <a href="tel:14567">14567</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Categories;