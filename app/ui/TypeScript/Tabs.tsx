// components/Tabs.tsx
import React from 'react';
import styles from '../CSS/Tabs.module.css';

interface TabProps {
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const Tab: React.FC<TabProps> = ({ label, onClick, isActive }) => {
  return (
    <div className={`${styles.tab} ${isActive ? styles.active : ''}`} onClick={onClick}>
      {label}
    </div>
  );
};

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChangeTab }) => {
  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <Tab
          key={tab}
          label={tab}
          onClick={() => onChangeTab(tab)}
          isActive={tab === activeTab}
        />
      ))}
    </div>
  );
};

export default Tabs;
