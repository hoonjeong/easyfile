import { useState, useEffect } from 'react';

const API_URL = 'https://visitor.6developer.com/visit';
const DOMAIN = 'easyfile.app';

export default function useVisitorCounter() {
  const [todayCount, setTodayCount] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    const recorded = sessionStorage.getItem('visitor_recorded');

    if (!recorded) {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: DOMAIN,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          page_path: window.location.pathname,
          page_title: document.title,
          referrer: document.referrer,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTodayCount(data.todayCount);
          setTotalCount(data.totalCount);
          sessionStorage.setItem('visitor_recorded', '1');
        })
        .catch(() => {});
    } else {
      fetch(`${API_URL}?domain=${DOMAIN}`)
        .then((res) => res.json())
        .then((data) => {
          setTodayCount(data.todayCount);
          setTotalCount(data.totalCount);
        })
        .catch(() => {});
    }
  }, []);

  return { todayCount, totalCount };
}
