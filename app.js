const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
    console.log("conneted to mongo yeahh");
})
mongoose.connection.on('error', (err) => {
    console.log("err connecting", err)
});

const itemSchema = {
    name: String
}

const listSchema = {
    name:String,
    items:[itemSchema]
};

const Item = mongoose.model("Item", itemSchema);

const List = mongoose.model("List",listSchema);

const item1 = new Item({
    name: "My name is Mongoose"
})
const item2 = new Item({
    name: "My name is Mongod"
})
const item3 = new Item({
    name: "My name is MongoDB"
});


const defaultItems = [item1, item2, item3];



app.get("/", (req, res) => {

    Item.find({}, (err, foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved to itemsDB");
                }
            });
            res.redirect("/");
        }
        else{
          res.render("list",{listTitle:"Today",items:foundItems});
        }

    })
});

app.get('/:customListName', (req, res) => {

    const customListname =_.capitalize(req.params.customListName);

    List.findOne({name:customListname}, (err,foundList)=>{
        if(!err){
            if(!foundList){
                //create a new list
                console.log("list not found");
                const list = new List({
                    name:customListname,
                    items:defaultItems
                 });
                 list.save();
               res.redirect("/"+customListname);
            }
            else{
            //show existing list
            console.log("list found");
            res.render("list",{listTitle:foundList.name,items:foundList.items});
            }
        }
    });
    
     
});

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
          name:itemName
     });

     if(listName === "Today"){
        item.save();
        res.redirect("/");
     } else {
       List.findOne({name:listName},(err,foundList)=>{
         if(!err){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+ listName)
         }
       })
     }
});

app.post("/delete",(req,res)=>{
    
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    console.log(req.body);

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId,(err)=>{
            if(!err){
                console.log("Sucessfully deleted the item");
                res.redirect("/");
            }
        });
    }else{
      List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},(err,foundList)=>{
         if(!err){
            console.log(foundList);
            res.redirect("/"+listName);
         }
      })
    }
    
   
})

app.listen(3000, () => {
    console.log("server is running on port 3000");
})

