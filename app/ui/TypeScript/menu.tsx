import { useState, useEffect, useRef } from 'react';
import styles from '../CSS/menu.module.css';

const Menu = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchRef = useRef(null);
  const searchBtn = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
	  const searchUIElement = document.querySelector(`.${styles.searchUI}`) as HTMLElement;
	  const searchButton = searchBtn.current;
	  const leftPanel = document.querySelector(`.${styles.menuContainer}`) as HTMLElement;
	  
	  if (isSearchVisible) {
		if (
		  searchRef.current &&
		  !searchRef.current.contains(event.target) &&
		  !searchButton.contains(event.target)
		) {
		  // Toggle search UI visibility
		  setIsSearchVisible(!isSearchVisible);

		  // Adjust the left position and width based on the visibility state
		  if (searchUIElement && leftPanel) {
			searchUIElement.style.left = '-300px'; // Move search UI off the screen
			leftPanel.style.width = '200px';
		  }
	    }
	  }	  
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSearchVisible]);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    // Adjust the left position based on the visibility state
	const searchUIElement = document.querySelector(`.${styles.searchUI}`) as HTMLElement;
	const leftpanel = document.querySelector(`.${styles.menuContainer}`) as HTMLElement;

	
	if (searchUIElement) {
	  if (!isSearchVisible) {
	    searchUIElement.style.left = '150px'; // Move search UI to the right
		leftpanel.style.width = '150px';
	  } else {
	    searchUIElement.style.left = '-300px'; // Move search UI off the screen
		leftpanel.style.width = '200px';
	  }
	}
  };

  return (
    <div>
      <div className={styles.menuContainer}>
        <div className={styles.menu}>
          <div className={styles.menuLabel}>BookClub.</div>
          <button className={styles.menuButton}>Home</button>
          <button className={styles.menuButton} ref={searchBtn} onClick={toggleSearch}>Search</button>
          <button className={styles.menuButton}>Explore</button>
          <button className={styles.menuButton}>Notifications</button>
          <button className={styles.menuButton}>Create</button>
          <button className={styles.menuButton}>Profile</button>
          <div className={styles.logoutButtonContainer}>
            <button className={styles.logoutButton}>Logout</button>
          </div>
        </div>
      </div>
	  <div className={styles.searchUI} ref={searchRef}>
		<div className={styles.searchLabel}>Search</div>
		<input type="text" placeholder="Search..." />
		{/* Add recommendations or other search UI elements here */}
	  </div>
	</div>
  );
};

export default Menu;
