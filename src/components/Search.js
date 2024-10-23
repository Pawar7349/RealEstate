import { useState } from "react";
const Search = ({ homes, setFilteredHomes }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        
        const filtered = homes.filter(home => 
            home.address.toLowerCase().includes(value.toLowerCase()) ||
            home.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredHomes(filtered); // Assuming you have a state for filtered homes in App.js
    };
    return (
        <header>
            <h2 className="header__title">Search it. Explore it. Buy it.</h2>
            <input
                type="text"
                className="header__search"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
                value={searchTerm}
                onChange={handleSearch}
            />
        </header>
    );
}

export default Search;