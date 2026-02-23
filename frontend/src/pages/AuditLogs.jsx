import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto' }}>
      <h2>Audit Logs</h2>
      <table width="100%">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id}>
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>{l.user_id}</td>
              <td>{l.action}</td>
              <td>{l.table_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
