import React, { Suspense, lazy } from 'react';
import styled from 'styled-components';
import { LoadingSpinner } from '../../services/loadingState';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

// Default loading fallback
const DefaultFallback = () => (
  <LoadingContainer>
    <LoadingSpinner size="medium" />
  </LoadingContainer>
);

// Performance optimization component
const PerformanceOptimizer = ({
  children,
  fallback = <DefaultFallback />,
  threshold = 100,
  rootMargin = '50px',
  once = true
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const targetRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, [threshold, rootMargin, once]);

  return (
    <div ref={targetRef}>
      {isVisible ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        <div style={{ minHeight: '200px' }} />
      )}
    </div>
  );
};

// Lazy load component with retry
const lazyLoadWithRetry = (importFn, options = {}) => {
  const {
    retries = 3,
    retryDelay = 1000,
    fallback = <DefaultFallback />
  } = options;

  return lazy(() => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attemptLoad = () => {
        attempts++;
        importFn()
          .then(resolve)
          .catch(error => {
            if (attempts < retries) {
              setTimeout(attemptLoad, retryDelay);
            } else {
              reject(error);
            }
          });
      };

      attemptLoad();
    });
  });
};

// Code split component
const CodeSplit = ({ children, fallback = <DefaultFallback /> }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Memoized component wrapper
const MemoizedComponent = React.memo(({ children, ...props }) => {
  return React.cloneElement(children, props);
});

// Virtualized list component
const VirtualizedList = ({
  items,
  renderItem,
  itemHeight = 50,
  overscan = 5,
  containerHeight = 400,
  containerStyle = {}
}) => {
  const containerRef = React.useRef(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = React.useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = React.useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', onScroll);
      return () => container.removeEventListener('scroll', onScroll);
    }
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        ...containerStyle
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={item.id || index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index + startIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Paginated list component
const PaginatedList = ({
  items,
  renderItem,
  pageSize = 10,
  containerStyle = {}
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, currentPage, pageSize]);

  const goToPage = React.useCallback((page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  return (
    <div style={containerStyle}>
      {paginatedItems.map((item, index) => (
        <div key={item.id || index}>
          {renderItem(item, index)}
        </div>
      ))}
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={{ margin: '0 10px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export {
  PerformanceOptimizer,
  lazyLoadWithRetry,
  CodeSplit,
  MemoizedComponent,
  VirtualizedList,
  PaginatedList,
  DefaultFallback
}; 