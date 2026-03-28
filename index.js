const cors = require('cors');

const pool = require("./db");
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(cors());
app.use(express.json());
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }

        req.user = decoded; // { id: ... }
        next();
    });
};
app.get("/test",(req,res)=>{
    res.send("API working")
});
/*app.get("/create-user",async (req,res)=>{
    const { email, password } = req.query;
    try {
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, password]
    );

    res.send("User created");
  } catch (err) {
    console.error(err);
    res.send("Error creating user");
  }
});
*/
/*app.post("/users",async (req,res)=>{
    const { email, password } = req.body;
    try {
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, password]
    );

    res.json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating user" });
  }
  
});
*/

app.post("/users" , async (req,res)=> {
    const { email, password } = req.body;
     try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, hashedPassword]
        );

    res.json({ message: "User registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registering user" });
  }





} );
app.post("/tasks", authenticateToken , async(req,res)=>{
   const { title} = req.body;
   if (!title)
   {
      return res.status(400).json({ error: "Title invalid" });

   }
    try {
        

        await pool.query(
        "INSERT INTO tasks (user_id, title) VALUES ($1, $2)",
        [req.user.id, title ]
        );

    res.json({ message: "Task added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Task invalid" });

  }

});
app.get("/tasks",authenticateToken,  async(req,res) => {
    const id = req.user.id;
    try{
        const result = await pool.query("SELECT id , title, completed FROM tasks WHERE user_id = $1", [req.user.id]);
        res.json(result.rows);

    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({ error: "Error fetching tasks" });

    }




  });


app.get("/users",authenticateToken,  async(req,res) => {
    try{
        const result = await pool.query("SELECT id, email FROM users");
        res.json(result.rows);

    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({ error: "Error fetching users" });

    }




  });


app.put("/users/:id",authenticateToken,  async (req,res)=>{
    if (parseInt(req.params.id) !== req.user.id) {
     return res.status(403).json({ error: "Not allowed" });
}
    const {id} = req.params;
    const{email,password}=req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try{
        await pool.query(
             "UPDATE users SET email = $1, password = $2 WHERE id = $3",
             [email,hashedPassword,id]
        );
        res.json({message : "User updated"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({ error: "Error updating user" });

    }



});
app.delete("/tasks/:id", authenticateToken,async (req,res)=>{
    
     const {id} = req.params;
    try{
        const result = await pool.query(
             "DELETE FROM tasks WHERE user_id = $1 AND id=$2",
             [ req.user.id ,id ]
        );
        if (result.rowCount === 1)
        {res.json({message : "Task deleted"});}
        else
        {
            {res.status(404).json({message : "No changes"});}

        }
        
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({ error: "Error deleting task" });

    }







});

app.delete("/users/:id",authenticateToken,  async (req,res)=>{
    if (parseInt(req.params.id) !== req.user.id) {
    return res.status(403).json({ error: "Not allowed" });
}
    
    const {id} = req.params;
    try{
        await pool.query(
             "DELETE FROM users WHERE id = $1",
             [id]
        );
        res.json({message : "User deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({ error: "Error deleting user" });

    }



});
app.put("/tasks/:id",authenticateToken,  async (req,res)=>{
    
    const {id} = req.params;
    const {completed,title} = req.body;
    if ( completed==null || !title)
    {
        return res.status(400).json({error:"invalid update"});
    }
   
    try{
        await pool.query(
             "UPDATE tasks SET completed = $1, title = $2 WHERE user_id = $3 AND id=$4",
             [completed,title,req.user.id,id]
        );
        res.json({message : "Task updated"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({ error: "Error updating Task" });

    }



});

app.post("/login",  async (req, res) => {
    const { email, password } = req.body;
     try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
        );

res.json({ accessToken, refreshToken });


    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login error" });
  }





});
app.post("/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token" });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        const newAccessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken: newAccessToken });
    });
});




const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
