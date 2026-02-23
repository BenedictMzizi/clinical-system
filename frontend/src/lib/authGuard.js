const session = await supabase.auth.getSession();
if(!session){
 navigate("/login");
}
