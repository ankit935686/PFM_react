import { useState } from 'react';

export const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child) => {
            if (!child) return null;
            if (child.type === TabsList) {
              return Array.isArray(child.props.children)
                ? child.props.children.map((tab) => {
                    if (!tab || tab.type !== TabsTrigger) return null;
                    return {
                      ...tab,
                      props: {
                        ...tab.props,
                        isActive: activeTab === tab.props.value,
                        setActiveTab,
                      },
                    };
                  })
                : child;
            }
            return child;
          })
        : children}
      {Array.isArray(children)
        ? children.map((child) => {
            if (!child || child.type !== TabsContent) return null;
            if (child.props.value === activeTab) {
              return child;
            }
            return null;
          })
        : children}
    </div>
  );
};

export const TabsList = ({ children, className = '' }) => (
  <div className={`flex gap-2 mb-4 border-b border-[#1F2937] ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, isActive, setActiveTab, children, className = '' }) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 font-medium transition border-b-2 ${
      isActive
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]'
    } ${className}`}
    type="button"
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, className = '' }) => (
  <div className={className}>{children}</div>
);
