const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      bio TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Posts table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Likes table
    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (post_id) REFERENCES posts (id),
      UNIQUE(user_id, post_id)
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (post_id) REFERENCES posts (id)
    )`);

    // Follows table
    db.run(`CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users (id),
      FOREIGN KEY (following_id) REFERENCES users (id),
      UNIQUE(follower_id, following_id)
    )`);

    // Insert sample data if tables are empty
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (row.count === 0) {
        insertSampleData();
      }
    });
  });
}

// Insert sample data
function insertSampleData() {
  const sampleUsers = [
    {
      username: 'john_doe',
      email: 'john@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'John Doe',
      bio: 'Software developer and coffee enthusiast ☕',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      username: 'jane_smith',
      email: 'jane@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Jane Smith',
      bio: 'Designer and creative thinker 🎨',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      username: 'mike_wilson',
      email: 'mike@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Mike Wilson',
      bio: 'Photographer capturing life\'s moments 📸',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  ];

  sampleUsers.forEach(user => {
    db.run(
      'INSERT INTO users (username, email, password, name, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [user.username, user.email, user.password, user.name, user.bio, user.avatar]
    );
  });

  // Insert sample posts after users are created
  setTimeout(() => {
    const now = new Date()
    const samplePosts = [
      {
        user_id: 1,
        content: 'Just finished building an amazing React app! The power of modern web development never ceases to amaze me. 🚀 #React #WebDev #Coding',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        user_id: 2,
        content: 'Working on some new design concepts today. Sometimes the best ideas come from unexpected places! ✨ #Design #Creativity #Inspiration',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
        created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        user_id: 3,
        content: 'Captured this beautiful sunset during my evening walk. Nature never fails to inspire! 🌅 #Photography #Nature #Sunset',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      }
    ];

    samplePosts.forEach(post => {
      db.run(
        'INSERT INTO posts (user_id, content, image, created_at) VALUES (?, ?, ?, ?)',
        [post.user_id, post.content, post.image, post.created_at]
      );
    });
  }, 1000);
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, name } = req.body;

  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, username, email, name } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        name: user.name,
        bio: user.bio,
        avatar: user.avatar
      } 
    });
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, name, bio, avatar FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, name, bio, avatar FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(users);
  });
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, (req, res) => {
  db.get('SELECT id, username, name, bio, avatar FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Get all posts
app.get('/api/posts', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      p.*,
      u.username,
      u.name,
      u.avatar,
      COUNT(DISTINCT l.id) as likes_count,
      COUNT(DISTINCT c.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.all(query, [req.user.id], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(posts);
  });
});

// Create post
app.post('/api/posts', authenticateToken, upload.single('image'), (req, res) => {
  const { content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!content && !image) {
    return res.status(400).json({ error: 'Content or image is required' });
  }

  db.run(
    'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
    [req.user.id, content || '', image],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating post' });
      }
      res.json({ id: this.lastID, message: 'Post created successfully' });
    }
  );
});

// Like/Unlike post
app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
  const postId = req.params.id;

  db.get('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId], (err, like) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (like) {
      // Unlike
      db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error unliking post' });
        }
        res.json({ message: 'Post unliked' });
      });
    } else {
      // Like
      db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error liking post' });
        }
        res.json({ message: 'Post liked' });
      });
    }
  });
});

// Get comments for a post
app.get('/api/posts/:id/comments', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      c.*,
      u.username,
      u.name,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;

  db.all(query, [req.params.id], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(comments);
  });
});

// Add comment
app.post('/api/posts/:id/comments', authenticateToken, (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;

  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  db.run(
    'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
    [req.user.id, postId, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error adding comment' });
      }
      res.json({ id: this.lastID, message: 'Comment added successfully' });
    }
  );
});

// Follow/Unfollow user
app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
  const followingId = req.params.id;

  if (req.user.id == followingId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  db.get('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, followingId], (err, follow) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (follow) {
      // Unfollow
      db.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, followingId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error unfollowing user' });
        }
        res.json({ message: 'User unfollowed' });
      });
    } else {
      // Follow
      db.run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, followingId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error following user' });
        }
        res.json({ message: 'User followed' });
      });
    }
  });
});

// Search posts
app.get('/api/search', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const query = `
    SELECT 
      p.*,
      u.username,
      u.name,
      u.avatar,
      COUNT(DISTINCT l.id) as likes_count,
      COUNT(DISTINCT c.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.content LIKE ? OR u.name LIKE ? OR u.username LIKE ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  const searchTerm = `%${q}%`;
  db.all(query, [req.user.id, searchTerm, searchTerm, searchTerm], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(posts);
  });
});

// Update current user's profile (avatar and bio)
app.post('/api/users/me', authenticateToken, upload.single('avatar'), (req, res) => {
  const { bio } = req.body;
  let avatar = null;
  if (req.file) {
    avatar = `/uploads/${req.file.filename}`;
  }

  // Build update query
  let query = 'UPDATE users SET ';
  const params = [];
  if (bio !== undefined) {
    query += 'bio = ?';
    params.push(bio);
  }
  if (avatar) {
    if (params.length > 0) query += ', ';
    query += 'avatar = ?';
    params.push(avatar);
  }
  query += ' WHERE id = ?';
  params.push(req.user.id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error updating profile' });
    }
    // Return updated user
    db.get('SELECT id, username, email, name, bio, avatar FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching updated user' });
      }
      res.json(user);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 