export function requireAuth(req,res,next){
  if(req.session?.user){
    req.user = req.session.user;
    return next();
  }
  if(req.accepts("html")) return res.redirect("/login");
  return res.status(401).json({ success:false, message:"Unauthorized" });
}
export function injectUser(req,res,next){
  res.locals.user = req.session?.user || null;
  next();
}
