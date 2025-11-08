"use client";
import React, { useState, useEffect } from "react";

function DataFetcher() {
  const [dataMessage, setDataMessage] = useState("Fetching data...");
  const [error, setError] = useState(null);
  const API_URL = "http://172.20.10.14:5000/api/data";

  useEffect(() => {
    // 1. Define the asynchronous function for fetching
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);

        // 2. Check if the HTTP status is OK (e.g., 200)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 3. Parse the JSON body
        const data = await response.json();

        // 4. Update the state with the received message
        setDataMessage(`Success! Message from Flask: "${data.message}"`);
        console.log("Helli");
      } catch (err) {
        // 5. Handle any errors (Network issues, CORS, etc.)
        console.error("Fetch error:", err);
        setError(`Failed to connect to backend: ${err.message}`);
        setDataMessage("Request failed.");
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs only once after initial render

  return (
    <div>
      <h1>Next.js to Flask (Cross-Device)</h1>
      <p>API Endpoint: **{API_URL}**</p>
      <hr />

      {error ? (
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      ) : (
        <p style={{ color: "green" }}>{dataMessage}</p>
      )}
    </div>
  );
}

export default DataFetcher;
