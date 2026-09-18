import re

with open('/home/praveenshinde/Shopping app/client/src/components/ChatWidget.tsx', 'r') as f:
    content = f.read()

# Add isScrolling state
if "const [isScrolling" not in content:
    content = content.replace("const [isOpen, setIsOpen] = useState(false);", "const [isOpen, setIsOpen] = useState(false);\n  const [isScrolling, setIsScrolling] = useState(false);")
    
    scroll_effect = """
  // Track scroll state to auto-hide/shrink FAB on mobile
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      if (isOpen) return; // Don't shrink if chat is open
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 400); // 400ms after scroll stops, reappear
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isOpen]);
"""
    content = content.replace("useEffect(() => {\n    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });\n  }, [messages]);", "useEffect(() => {\n    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });\n  }, [messages]);" + scroll_effect)

# Update container classes
content = content.replace('<div className="fixed bottom-6 right-6 z-50">', """<div className={`fixed right-4 sm:right-6 z-50 transition-all duration-300 ease-out ${isOpen ? 'bottom-4 sm:bottom-6' : 'bottom-20 sm:bottom-6'} ${isScrolling && !isOpen ? 'opacity-40 scale-75 translate-y-8 sm:translate-y-0 sm:opacity-100 sm:scale-100' : 'opacity-100 scale-100 translate-y-0'}`}>""")

with open('/home/praveenshinde/Shopping app/client/src/components/ChatWidget.tsx', 'w') as f:
    f.write(content)
