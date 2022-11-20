App = {
    web3Provider: null,
    contracts: {},
    emptyAddress: "0x0000000000000000000000000000000000000000",
    sku: 0, //sku to fetch/display as supplied to input form
    upc: 0, // upc to fetch/display as supplied on the input form
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    ownerID: "0x0000000000000000000000000000000000000000",
    originFarmerID: "0x0000000000000000000000000000000000000000",
    originFarmName: null,
    originFarmInformation: null,
    originFarmLatitude: null,
    originFarmLongitude: null,
    productNotes: null,
    productPrice: 0,
    distributorID: "0x0000000000000000000000000000000000000000",
    retailerID: "0x0000000000000000000000000000000000000000",
    consumerID: "0x0000000000000000000000000000000000000000",
    _upcCounter: 0, // not displayed, used internally when harvesting new items
    stateMapping: {
        0: 'Harvested (Default)',  
        1: 'Processed', 
        2: 'Packed',    
        3: 'ForSale',
        4: 'Sold', 
        5: 'Shipped', 
        6: 'Received', 
        7: 'Purchased'
    },

    init: async function () {
        App.readForm();
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    readForm: function () {
        App.sku = $("#sku").val();
        App.upc = $("#upc").val();
        App.ownerID = $("#ownerID").val();
        App.originFarmerID = $("#originFarmerID").val();
        App.originFarmName = $("#originFarmName").val();
        App.originFarmInformation = $("#originFarmInformation").val();
        App.originFarmLatitude = $("#originFarmLatitude").val();
        App.originFarmLongitude = $("#originFarmLongitude").val();
        App.productNotes = $("#productNotes").val();
        App.productPrice = $("#productPrice").val();
        App.distributorID = $("#distributorID").val();
        App.retailerID = $("#retailerID").val();
        App.consumerID = $("#consumerID").val();

        console.log(
            App.sku,
            App.upc,
            App.ownerID, 
            App.originFarmerID, 
            App.originFarmName, 
            App.originFarmInformation, 
            App.originFarmLatitude, 
            App.originFarmLongitude, 
            App.productNotes, 
            App.productPrice, 
            App.distributorID, 
            App.retailerID, 
            App.consumerID
        );
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        App.getMetaskAccountID();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        web3 = new Web3(App.web3Provider);

        // Retrieving accounts
        web3.eth.getAccounts(function(err, res) {
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskID:',res);
            App.metamaskAccountID = res[0];
            web3.eth.defaultAccount = web3.eth.accounts[0]; // used for default operations

        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain='../../build/contracts/SupplyChain.json';
        
        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function(data) {
            console.log('data',data);
            var SupplyChainArtifact = data;
            App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            App.contracts.SupplyChain.setProvider(App.web3Provider);
            
            App.fetchItemBufferOne();
            App.fetchItemBufferTwo();
            App.fetchEvents();

        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function(event) {
        event.preventDefault();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId',processId);
        

        if ( processId >= 1 && processId <= 10) {

            App.getMetaskAccountID();

            // refresh app data as the data fetched during init 
            // becomes stale once the user updates an input on the page
            App.readForm();
        }

        switch(processId) {
            case 1:
                return await App.harvestItem(event);
                break;
            case 2:
                return await App.processItem(event);
                break;
            case 3:
                return await App.packItem(event);
                break;
            case 4:
                return await App.sellItem(event);
                break;
            case 5:
                return await App.buyItem(event);
                break;
            case 6:
                return await App.shipItem(event);
                break;
            case 7:
                return await App.receiveItem(event);
                break;
            case 8:
                return await App.purchaseItem(event);
                break;
            case 9:
                return await App.fetchItemBufferOne(event);
                break;
            case 10:
                return await App.fetchItemBufferTwo(event);
                break;
            case 11:
                return await App.addRetailer(event);
                break;
            case 12:
                return await App.addConsumer(event);
                break;
            }
    },

    addRetailer: function(event) {
        event.preventDefault();
        var _address = $('#retailerAddress').val();

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.addRetailer(_address);
        }).then(function(result) {
            console.log('addRetailer: ', result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    addConsumer: function(event) {
        event.preventDefault();
        var _address = $('#consumerAddress').val();

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.addConsumer(_address);
        }).then(function(result) {
            console.log('addConsumer: ', result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    harvestItem: function(event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        console.log("data input to harvest here: ",
            App.upc, 
                App.metamaskAccountID, 
                App.originFarmName, 
                App.originFarmInformation, 
                App.originFarmLatitude, 
                App.originFarmLongitude, 
                App.productNotes
        )

        App.contracts.SupplyChain.deployed().then(function(instance) {
            _upc = App._upcCounter;
            App._upcCounter ++;
            return instance.harvestItem(
                _upc, 
                App.metamaskAccountID, 
                App.originFarmName, 
                App.originFarmInformation, 
                App.originFarmLatitude, 
                App.originFarmLongitude, 
                App.productNotes
            );
        }).then(function(result) {
            // console.log('harvestItem',result);
            $('#upc').val(_upc); // set upc for data to display
            App.fetchItemBufferOne()
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    processItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.processItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('processItem',result);
            // populate page with updated info
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },
    
    packItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.packItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('packItem',result);
            // populate page with updated info
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    sellItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const productPrice = web3.toWei(1, "ether");
            console.log('productPrice',productPrice);
            return instance.sellItem(App.upc, App.productPrice, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('sellItem',result);
            // populate page with updated info
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    buyItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const walletValue = web3.toWei(3, "ether");
            return instance.buyItem(App.upc, {from: App.metamaskAccountID, value: walletValue});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('buyItem',result);
            // populate page with updated info
            App.fetchItemBufferOne(); // required to update ownerID
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    shipItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.shipItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('shipItem',result);
            // populate page with updated info
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    receiveItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.receiveItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('receiveItem',result);
            // populate page with updated info
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    purchaseItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.purchaseItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('purchaseItem',result);
            // populate page with updated info
            App.fetchItemBufferOne(); // required to update ownerID
            App.fetchItemBufferTwo();
        }).catch(function(err) {
            console.log(err.message);
        });
    },


    updateFetchFieldsOne: function(buffer) {
        // uint    itemSKU,
        // uint    itemUPC,
        // address ownerID,
        // address originFarmerID,
        // string  originFarmName,
        // string  originFarmInformation,
        // string  originFarmLatitude,
        // string  originFarmLongitude

        $("#sku").val(buffer[0]);
        $("#upc").val(buffer[1]);
        $("#ownerID").val(buffer[2]);
        $("#originFarmerID").val(buffer[3]);
        $("#originFarmName").val(buffer[4]);
        $("#originFarmInformation").val(buffer[5]);
        $("#originFarmLatitude").val(buffer[6]);
        $("#originFarmLongitude").val(buffer[7]);
    },

    updateFetchFieldsTwo: function(buffer) {
        // uint    itemSKU,
        // uint    itemUPC,
        // uint    productID,
        // string  productNotes,
        // uint    productPrice,
        // uint    itemState,
        // address distributorID,
        // address retailerID,
        // address consumerID

        $("#sku").val(buffer[0]);
        $("#upc").val(buffer[1]);
        $("#productID").val(buffer[2]);
        $("#productNotes").val(buffer[3]);
        $("#productPrice").val(buffer[4]);
        $("#itemState").val(App.stateMapping[buffer[5]]);
        $("#distributorID").val(buffer[6]);
        $("#retailerID").val(buffer[7]);
        $("#consumerID").val(buffer[8]);
    },

    fetchItemBufferOne: function () {
    ///   event.preventDefault();
    ///    var processId = parseInt($(event.target).data('id'));
        App.upc = $('#upc').val();
        console.log('upc to fetch: ',App.upc);

        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchItemBufferOne(App.upc);
        }).then(function(result) {
          // $("#ftc-item").text(result);
          console.log('fetchItemBufferOne', result);
          App.updateFetchFieldsOne(result);
        }).catch(function(err) {
          console.log(err.message);
        });
    },

    fetchItemBufferTwo: function () {
    ///    event.preventDefault();
    ///    var processId = parseInt($(event.target).data('id'));
                        
        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchItemBufferTwo.call(App.upc);
        }).then(function(result) {
          // $("#ftc-item").text(result);
          console.log('fetchItemBufferTwo', result);
          App.updateFetchFieldsTwo(result);
        }).catch(function(err) {
          console.log(err.message);
        });
    },

    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                App.contracts.SupplyChain.currentProvider,
                    arguments
              );
            };
        }

        App.contracts.SupplyChain.deployed().then(function(instance) {
        var events = instance.allEvents(function(err, log){
          if (!err)
            $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
        });
        }).catch(function(err) {
          console.log(err.message);
        });
        
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
