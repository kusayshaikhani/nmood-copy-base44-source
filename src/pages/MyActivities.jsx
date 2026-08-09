import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityCard from '@/components/my-activities/ActivityCard';
import EmptyActivities from '@/components/my-activities/EmptyActivities';
import { myActivities } from '@/lib/my-activities-data';

const tabs = ['Upcoming', 'Hosting', 'Saved', 'Completed', 'Cancelled'];

export default function MyActivities() {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const navigate = useNavigate();

  const tabKey = activeTab.toLowerCase();
  const activities = myActivities[tabKey] || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Experiences</h1>
        <p className="text-sm text-muted-foreground">Everything you're part of.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const count = (myActivities[tab.toLowerCase()] || []).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'
              }`}
            >
              {tab}
              <span className={`ms-1.5 ${activeTab === tab ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {activities.length === 0 ? (
        <EmptyActivities onDiscover={() => navigate('/explore')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <ActivityCard key={`${activity.type}-${activity.id}`} activity={activity} tab={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}