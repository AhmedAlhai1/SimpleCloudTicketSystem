import { auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// import 'useState' to give our component memory
import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { db } from './firebase.js'; // Import your bridge file
import { collection, addDoc, updateDoc, deleteDoc, getDocs, runTransaction, doc, serverTimestamp, onSnapshot, query, orderBy, getFirestore } from 'firebase/firestore'; // allows a command to push the data
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDGnLvJFoVp6z7Toi4u5loQV3qSR5YJn9I",
  authDomain: "simple-ticket-system-34f2f.firebaseapp.com",
  projectId: "simple-ticket-system-34f2f",
  storageBucket: "simple-ticket-system-34f2f.firebasestorage.app",
  messagingSenderId: "828911731066",
  appId: "1:828911731066:web:cf5b7567d1279c4c67d6c3"
};

const app = initializeApp(firebaseConfig);


function App() {
  // State: Tracks if a user is logged in
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // The Listener: Checks if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if(currentUser){
        setUser(currentUser); // User is logged in
      } else {
        setUser(null); // User is logged out
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password); // Firebase will handle the rest, the listener above will notice the change
    } catch (error) {
      alert("Invalid email or password");
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  //  define our state variable.
  // 'showInput' is the value (true or false).
  // 'setShowData' is the function we use to change that value.
  // check explainations.txt for Array Destructuring which is declaring these variables using useState.
  // const [showData, setShowData] = useState(false);
  const [tickets, setTickets] = useState([]);
  // const [currentTicket, setCurrentTicket] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");


  // Updates the data automatically and displays the tickets in an ascending order. Essentially making the app "Real Time"
  useEffect(() => {
    // Create a "Query" to tell Firebase what we want
    // "Go to 'tickets' collection AND sort them by 'ticketNumber' in ascending order"
    const q = query(collection(db, "tickets"), orderBy("ticketNumber", "asc"));

    // Open the Live Pipe (onSnapshot)
    // This function runs AUTOMATICALLY every time the database changes
    const unsubscribe = onSnapshot(q, (snapshot) => {
      
      const loadedTickets = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        }
      });

      // Update the screen instantly
      setTickets(loadedTickets);
    });

    // When the user leaves the page, this closes the pipe to save memory
    return () => unsubscribe();

  }, []);

  // Function to delete a ticket
  async function handleDelete(id) {
    // Optional: Add a confirmation box so users don't delete by accident
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        // 1. Reference the specific document "tickets/2xy8Q..."
        const ticketRef = doc(db, "tickets", id);
        
        // 2. Delete it
        await deleteDoc(ticketRef);
        
        // Note: No need to update state manually; onSnapshot handles it!
        
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }
    }
  }

  async function updateStatus(id, currentStatus) {
    const ticketRef = doc(db, "tickets", id);

    // Logic: If it is Open, make it Resolved. Otherwise, make it Open.
    const newStatus = currentStatus === "Open" ? "Resolved" : "Open";

    try {
      // updateDoc only changes the fields provided in the object
      await updateDoc(ticketRef, {status: newStatus});
    } catch (error) {
      console.error("Error updating ticket: ", error);
    }
  }




  // This runs ONCE when the app loads
  // Check explainations.txt A5 for useEffect usage
  // useEffect(() => {
    
  //   async function fetchTickets() {
  //     // 1. Create a reference to the "tickets" collection
  //     const querySnapshot = await getDocs(collection(db, "tickets"));
      
  //     // 2. Transform the weird Firebase data into a normal array
  //     // Firebase returns a "Snapshot", not a simple array.
  //     // We have to loop through it to extract the .data() and the .id
  //     const loadedTickets = querySnapshot.docs.map(doc => {
  //       return {
  //         id: doc.id,       // The auto-generated ID (e.g., "7a8s9d7...")
  //         ...doc.data()     // The actual fields (title, priority, etc.)
  //       }
  //     });

  //     // 3. Save it to React State
  //     setTickets(loadedTickets);
  //   }

  //   fetchTickets(); // Run the function we just wrote

  // }, []); // <--- The Empty Array means "Run only on mount". VERY IMPORTANT TO NOT TO FORGET TO INCLUDE THIS, otherwise It runs every single millisecond in an infinite loop until Google bans your API key for overuse. Do not forget the array!

  // This function runs when the button is clicked. Note: Added async later because we must mark the function as "asynchronous" because talking to a server takes time (even if it's just milliseconds), and JavaScript needs to wait for it.
  async function handleClick(e){
    e.preventDefault(); // Prevents page refresh

    if (title === "") return; // If title input field is empty, do not add.

    // This runs the transaction function, check explainations.txt A7 for more info on what each line does
    try{
      await runTransaction(db, async(transaction) => {

        const counterDocRef = doc(db, "metadata", "ticketCounter");
        const counterDoc = await transaction.get(counterDocRef);

        if(!counterDoc.exists()) {
          throw "Counter does not exist!";
        }

        const newCount = counterDoc.data().count + 1;

      // Ticket Object
      // The object we want to send
      // Note: We don't need 'id: Date.now()' anymore because 
      // Firebase generates a secure ID automatically
      const newTicket = {
        // id: Date.now(),
        ticketNumber: newCount,
        title: title,
        description: description,
        priority: priority,
        status: "Open",
        createdAt: serverTimestamp()
      };

      transaction.update(counterDocRef, {count: newCount});

      const newTicketRef = doc(collection(db, "tickets"));
      transaction.set(newTicketRef, newTicket);

      console.log("Transaction successfully committed!");
        
      })
    } catch(error) {
      console.error("Transaction failed: " + error);
    }

    

    // try {
    //   // SEND TO FIREBASE
    //   // "Wait (await) for the database (db) to add this document (newTicket)
    //   // into the collection named 'tickets'."
    //   const docRef = await addDoc(collection(db, "tickets"), newTicket);

    //   // Optional: Log the ID to the console so you know it worked
    //   console.log("Document written with ID: ", docRef.id);

    //   // 3. Update Local State (So you see it immediately on screen)
    //   // We add the Firebase ID to our local object so keys work correctly
    //   setTickets([...tickets, { ...newTicket, id: docRef.id }]);

    //   // 4. Clear the form
    //   setTitle("");
    //   setDescription("");

    // } catch (error) {
    //   console.error("Error adding document: ", error);
    // }


    // Add the object to the list
    // setTickets([...tickets, newTicket]);

    // // Clears input fields when the button is clicked
    // setTitle("");
    // setDescription("");

    // if(currentTicket === "") return; // If the input is empty, do not add

    // // Adding to the array
    // // We create a NEW array: [...oldItems, newItem]
    // setTickets([...tickets, currentTicket]);
    // // Clear the input box after adding
    // setCurrentTicket("");
  }

  // function DisplayTicket(){
  //   // Set the boolean of showData to true or to false
  //   setShowData(!showData);
  // }

  // If user is null, we return the login form
  // the rest of the app is hidden
  if (!user) {
    return (
      <div style={{ padding: '50px' }}>
        <h1>Login Required</h1>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit">Log In</button>
        </form>
      </div>
    );
  }



  // if we pass the check above, render the app
  return(  
    <div style={{padding: '20px'}}>

  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>SimpleCloud Ticket System</h1>
        {/* Add a Logout Button to the header */}
        <button onClick={handleLogout}>Log Out ({user.email})</button>
      </div>
    <br/>

    <input 
    placeholder='Title'
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    />

    <input
    placeholder='Description'
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    />

    <p>Priority</p>
    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
      <option value={"Low"}>Low</option>
      <option value={"Medium"}>Medium</option>
      <option value={"High"}>High</option>
    </select>

    <button onClick={handleClick}>Submit Ticket</button>

    <hr />
      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ border: '1px solid gray', margin: '10px', padding: '10px' }}>
          {/* Now we access data using DOT notation (.title, .priority) */}
          <h3>Ticket No.: {ticket.ticketNumber} | {ticket.title}</h3>
          <p>{ticket.description}</p>
          <p>Priority: <strong>{ticket.priority}</strong></p>
          <p>Status: <span 
              onClick={() => updateStatus(ticket.id, ticket.status)}
              style={{ 
                cursor: 'pointer', 
                fontWeight: 'bold',
                color: ticket.status === "Open" ? "green" : "red",
                marginLeft: '5px' 
              }}
            >
              {ticket.status}
            </span>
            <span style={{ fontSize: '0.8em', color: 'gray', marginLeft: '10px' }}>
              (Click to toggle)
            </span></p>
          <p>Date Created: {ticket.serverTimestamp}</p>

          <button onClick={() => handleDelete(ticket.id)} style={{backgroundColor: 'red', color: 'white', marginTop: '10px'}}>
            Delete
          </button>

        </div>
      ))}


    {/* This input field has an event handler that checks for text the user input into the text field. This event handler then transfers the data to currentTicket */}
    {/* <input
      type="text"
      value={currentTicket}
      onChange={(e) => setCurrentTicket(e.target.value)} // TODO: Check explainations.txt for understanding this line of code
      placeholder="Enter ticket issue..."
    /> */}



    {/* The Button - This method is to store data locally through strings only. */}
    {/* We connect the click event to our function */}
    {/* <button onClick={handleClick}>
      Add Ticket
    </button>
    <button onClick={DisplayTicket}> */}
      {/* Ternary Operator - One-Line IF-Statement check explainations.txt*/}
      {/* {showData ? "Hide Tickets" : "Display Tickets"}
    </button>
    <h3>Current Tickets:</h3> */}
      
        {/* Rendering lists using a loop function*/}
        {/* We use .map() to loop through the array and display HTML for each item */}
        {/* {showData && (
        <ul>
          {tickets.map((ticket, index) => (
          <li key={index}>{ticket}</li>
        ))}
        </ul>
        )} */}

        
      

      {/* Conditional Rendering */}
      {/* This reads as: IF showInput is true, THEN show the input tag / all the HTML code will be shown in this conditional*/}
      {/* {showInput && (
        <div style={{ marginTop: '20px' }}>
          <label>Describe your issue: </label>
          <input type="text" placeholder="Type here..." />
        </div>
        )
      } */}




  </div>
  </div>
)
}

export default App
