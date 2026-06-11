import { useState } from 'react';
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function MainLayout() {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <main className={`${isExpanded ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300 ease-in-out`}>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout