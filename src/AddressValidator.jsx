import React, { useState } from "react";
import axios from "axios";
import "./AddressValidator.css";

const AddressValidator = () => {
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");

  const [adminLevel3, setAdminLevel3] = useState("");
  const [adminLevel2, setAdminLevel2] = useState("");
  const [adminLevel1, setAdminLevel1] = useState("");
  const [locality, setLocality] = useState("");

  // Function to fetch geocode data based on latitude and longitude
  const fetchGeocodeData = async (lat, lng) => {
    const apiUrl = "https://maps.googleapis.com/maps/api/geocode/json";
    const apiKey = "AIzaSyCJQHv3pYfnPd6F3ju1DXZ7jm46PJbncuk"; // Replace with your actual API key

    try {
      setLoading(true);
      const response = await axios.get(
        `${apiUrl}?latlng=${lat},${lng}&key=${apiKey}`,
      );
      const addressComponents = response.data.results[0].address_components;

      let extractedPostalCode = "";
      let extractedAdminLevel3 = "";
      let extractedAdminLevel2 = "";
      let extractedAdminLevel1 = "";
      let extractedLocality = "";

      // Extract postal code and all administrative levels
      addressComponents.forEach((component) => {
        if (component.types.includes("postal_code")) {
          extractedPostalCode = component.long_name;
        }

        if (component.types.includes("administrative_area_level_3")) {
          extractedAdminLevel3 = component.long_name;
        }

        if (component.types.includes("administrative_area_level_2")) {
          extractedAdminLevel2 = component.long_name;
        }

        if (component.types.includes("administrative_area_level_1")) {
          extractedAdminLevel1 = component.long_name;
        }

        if (component.types.includes("locality")) {
          extractedLocality = component.long_name;
        }
      });

      // Store these values in state
      setPostalCode(extractedPostalCode || "Not found");
      setAdminLevel3(extractedAdminLevel3);
      setAdminLevel2(extractedAdminLevel2);
      setAdminLevel1(extractedAdminLevel1);
      setLocality(extractedLocality);

      // Check location data starting with pincode
      console.log("Checking services using Pincode first...");
      checkPincodeFirst(
        extractedPostalCode,
        extractedAdminLevel3,
        extractedAdminLevel2,
        extractedAdminLevel1,
        extractedLocality,
      );
    } catch (err) {
      setError("Failed to fetch address data.");
      setPostalCode("");
      setLoading(false);
    }
  };

  // Function to check location data based on pincode first and then fallback to district
  const checkPincodeFirst = async (
    pincode,
    adminLevel3,
    adminLevel2,
    adminLevel1,
    locality,
  ) => {
    try {
      setLoading(true);

      // First, try with custom/:pincode
      console.log("Trying custom/:pincode...");
      const pincodeResponse = await axios.get(
        `https://api.coolieno1.in/v1.0/core/locations/custom/${pincode}`,
      );

      if (pincodeResponse.data && pincodeResponse.data.length > 0) {
        console.log("Services found for the Pincode.");
        setLocationData(pincodeResponse.data);
        setFilteredData(pincodeResponse.data); // Set filtered data initially as full data
      } else {
        console.log(
          "No services found for the Pincode. Falling back to district...",
        );
        checkLocationData(adminLevel3, adminLevel2, adminLevel1, locality);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking services by pincode:", error.message);
      checkLocationData(adminLevel3, adminLevel2, adminLevel1, locality);
    }
  };

  // Function to check location data based on administrative levels
  const checkLocationData = async (
    adminLevel3,
    adminLevel2,
    adminLevel1,
    locality,
  ) => {
    try {
      setLoading(true);

      // Try with adminLevel3 (administrative_area_level_3)
      let districtResponse = await axios.get(
        `https://api.coolieno1.in/v1.0/core/locations/district/${adminLevel3}`,
      );

      if (districtResponse.data && districtResponse.data.length > 0) {
        console.log("Services found for Admin Level 3.");
        setLocationData(districtResponse.data);
        setFilteredData(districtResponse.data);
      } else {
        console.log("No services for Admin Level 3. Trying Admin Level 2...");

        // Fallback to adminLevel2
        districtResponse = await axios.get(
          `https://api.coolieno1.in/v1.0/core/locations/district/${adminLevel2}`,
        );

        if (districtResponse.data && districtResponse.data.length > 0) {
          console.log("Services found for Admin Level 2.");
          setLocationData(districtResponse.data);
          setFilteredData(districtResponse.data);
        } else {
          console.log("No services for Admin Level 2. Trying Admin Level 1...");

          // Fallback to adminLevel1
          districtResponse = await axios.get(
            `https://api.coolieno1.in/v1.0/core/locations/district/${adminLevel1}`,
          );

          if (districtResponse.data && districtResponse.data.length > 0) {
            console.log("Services found for Admin Level 1.");
            setLocationData(districtResponse.data);
            setFilteredData(districtResponse.data);
          } else {
            // Fallback to locality if no services found in any admin level
            console.log(
              "No services found in Admin Levels. Falling back to Locality...",
            );
            checkLocality(locality);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      setError("We are not serving at this location.");
      setLocationData(null);
      setLoading(false);
    }
  };

  // Fallback to locality
  const checkLocality = async (locality) => {
    try {
      setLoading(true);
      let localityResponse = await axios.get(
        `https://api.coolieno1.in/v1.0/core/locations/district/${locality}`,
      );

      if (localityResponse.data && localityResponse.data.length > 0) {
        console.log("Services found for locality.");
        setLocationData(localityResponse.data);
        setFilteredData(localityResponse.data);
      } else {
        setError("We are not serving at this location.");
        setLocationData(null);
      }

      setLoading(false);
    } catch (error) {
      setError("We are not serving at this location.");
      setLocationData(null);
      setLoading(false);
    }
  };

  // Function to filter location data based on pincode input
  const filterByPincode = (e) => {
    const pincode = e.target.value;
    setPincodeInput(pincode);
    console.log("Filtering services by Pincode:", pincode);

    if (locationData && pincode) {
      const filtered = locationData.filter((item) =>
        item.pincode.toString().includes(pincode),
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(locationData); // Reset if no pincode entered
    }
  };

  // Function to get current location
  const getLocation = () => {
    if (navigator.geolocation) {
      console.log("Requesting user's current location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("User's location fetched:", lat, lng);
          fetchGeocodeData(lat, lng); // Fetch data based on current location
        },
        (error) => {
          console.error("Geolocation permission denied.");
          setError("Geolocation permission denied.");
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div>
      <h2>Address Validator</h2>
      <button onClick={getLocation}>
        Get Current Location & Validate Address
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="result-box">
        <p>
          <strong>Admin Level 3:</strong> {adminLevel3}
        </p>
        <p>
          <strong>Admin Level 2:</strong> {adminLevel2}
        </p>
        <p>
          <strong>Admin Level 1:</strong> {adminLevel1}
        </p>
        <p>
          <strong>Locality:</strong> {locality}
        </p>
        <p>
          <strong>Pincode:</strong> {postalCode}
        </p>
      </div>

      {loading && <p>Loading data...</p>}

      {locationData && (
        <div className="location-data-box">
          <h3>Available Services</h3>

          {/* Pincode input field for filtering */}
          <input
            type="text"
            placeholder="Search by pincode"
            value={pincodeInput}
            onChange={filterByPincode}
            className="pincode-input"
          />

          <div className="card-grid">
            {filteredData.length > 0 ? (
              filteredData.map((service) => (
                <div
                  className={`card ${service.isCustom ? "custom-card" : ""}`}
                  key={service._id}
                >
                  <h3>{service.servicename}</h3>
                  {service.isCustom && (
                    <p className="custom-pricing-message">
                      <strong>Note:</strong> This is custom pricing.
                    </p>
                  )}
                  <p>
                    <strong>Category:</strong> {service.category}
                  </p>
                  <p>
                    <strong>Subcategory:</strong> {service.subcategory}
                  </p>
                  <p>
                    <strong>Location:</strong> {service.location}
                  </p>
                  <p>
                    <strong>Pincode:</strong> {service.pincode}
                  </p>
                  <p>
                    <strong>Price (Normal):</strong> {service.price.normal}
                  </p>
                  <p>
                    <strong>Price (Deep):</strong> {service.price.deep}
                  </p>
                  <p>
                    <strong>Tax Percentage:</strong> {service.taxPercentage}%
                  </p>
                  <p>
                    <strong>Misc Fee:</strong> ₹{service.miscFee}
                  </p>
                </div>
              ))
            ) : (
              <p>No services found for this pincode.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressValidator;
