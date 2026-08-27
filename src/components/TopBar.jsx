export default function TopBar({ searchPlaceholder = 'Search...', onSearch, showProfile = true, leftContent, rightContent }) {
  return (
    <div className="topbar">
      <div>
        {leftContent || (
          <input
            className="topbar-search"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        )}
      </div>
      <div>
        {rightContent || (
          showProfile && (
            <div className="topbar-profile">
              <div className="topbar-avatar" />
              <span className="topbar-name">Admin</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
