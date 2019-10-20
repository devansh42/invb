var createError = require('http-errors');
var express = require('express');
var multer=require("multer");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var {authR,checkAuth}=require("./routes/auth/authR");
var authMiddleware=require("./routes/auth/authMiddleware");
var app = express();
var formData=multer();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);






let cors=(req,res)=>{
  res.set("Access-Control-Allow-Origin","http://localhost:3001");
  res.set("Access-Control-Allow-Credentials","true");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  res.set("Access-Control-Allow-Headers", "access-control-allow-origin,Content-Type,Authorization, Accept, X-Requested-With, remember-me");
  res.status(200).end();
};

app.options("/*",cors);

app.use((req,res,next)=>{
  res.set("Access-Control-Allow-Origin","http://localhost:3001");
  res.set("Access-Control-Allow-Credentials","true");
  
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  res.set("Access-Control-Allow-Headers", "access-control-allow-origin,Content-Type,Authorization,Accept, X-Requested-With, remember-me");
  next();
})
app.post("/auth",formData.none(),authR);
//check if user is already logined or not
app.post("/checkAuth",[authMiddleware],checkAuth);

//Checks auth token and forward request
app.use("/app",authMiddleware);


app.post("/demo",formData.none(),(r,w)=>{
  console.log(r.body);
  w.status(200).end();
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
