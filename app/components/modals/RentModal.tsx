"use client";

import useRentModal from "@/app/hooks/useRentModal";
import Modal from "./Modal";
import { useEffect, useMemo, useState } from "react";
import Heading from "../Heading";
import { categories } from "../navbar/Categories";
import CategoryInput from "../inputs/CategoryInput";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import CountrySelect from "../inputs/CountrySelect";
import dynamic from "next/dynamic";
import Counter from "../inputs/Counter";
import ImageUpload from "../inputs/ImageUpload";
import Input from "../inputs/Input";
import DatePick from "../inputs/DatePick";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Switch from "react-switch";

enum STEPS {
  CATEGORY = 0,
  LOCATION = 1,
  INFO = 2,
  IMAGES = 3,
  DESCRIPTION = 4,
  PRICE = 5,
}

const RentModal = () => {
  const router = useRouter();
  const rentModal = useRentModal();

  const [step, setStep] = useState(STEPS.CATEGORY);
  const [isLoading, setIsLoading] = useState(false);
  const [canAdvance, setCanAdvance] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      category: "",
      location: null,
      guestCount: 1,
      roomCount: 1,
      bathroomCount: 1,
      imageSrc: [],
      price: 1,
      title: "",
      description: "",
      leaseStartDate: null,
      leaseEndDate: null,
      distValue: 0.0,
      isActive: true
    },
  });

  const category = watch("category");
  const locationValue = watch("location");
  const guestCount = watch("guestCount");
  const roomCount = watch("roomCount");
  const bathroomCount = watch("bathroomCount");
  const imageSrc: string[] = watch("imageSrc");
  const leaseStartDate = watch("leaseStartDate");
  const leaseEndDate = watch("leaseEndDate");
  const isActive = watch("isActive");
  const [disabled, setDisabled] = useState(false);

  const Map = useMemo(
    () =>
      dynamic(() => import("../Map"), {
        ssr: false,
      }),
    [locationValue]
  );

  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onBack = () => {
    setStep((value) => value - 1);
  };

  const onNext = () => {
    setStep((value) => value + 1);
  };

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    if (!canAdvance) {
      return;
    }

    if (step !== STEPS.PRICE) {
      return onNext();
    }

    setIsLoading(true);
    axios
      .post("/api/listings", data)
      .then(() => {
        toast.success("Listing Created");
        router.refresh();
        reset();
        setStep(STEPS.CATEGORY);
        rentModal.onClose();
      })
      .catch(() => {
        toast.error("Something went wrong.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const actionLabel = useMemo(() => {
    if (step === STEPS.PRICE) {
      return "Create";
    }

    return "Next";
  }, [step]);

  const secondaryActionLabel = useMemo(() => {
    if (step === STEPS.CATEGORY) {
      return undefined;
    }
    return "Back";
  }, [step]);

  useEffect(() => {
    if (leaseStartDate && leaseEndDate) {
      if (leaseEndDate - leaseStartDate <= 0) {
        toast.error("Lease End Date must end after the Lease Start Date");
        setCanAdvance(false);
      } else {
        setCanAdvance(true);
      }
    }
  }, [leaseStartDate, leaseEndDate]);

  let bodyContent = (
    <div className="flex flex-col gap-8">
      <Heading
        title="Which of the following best describes your place?"
        subtitle="Pick a category"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
        {categories.map((item) => (
          <div key={item.label} className="col-span-1">
            <CategoryInput
              onClick={(category) => setCustomValue("category", category)}
              selected={category === item.label}
              label={item.label}
              icon={item.icon}
            />
          </div>
        ))}
      </div>
    </div>
  );

  //to not allow a null location
  useEffect(() => {
    if (step === STEPS.LOCATION) {
      if (!locationValue || locationValue?.label === "") {
        setDisabled(true);
      } else {
        setDisabled(false);
      }
    }
  }, [step, locationValue]);

  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Where is your place located?"
          subtitle="Help students see where they'll stay!"
        />
        <CountrySelect
          locationValue={locationValue}
          onChange={(value) => setCustomValue("location", value)}
        />
        <Map center={locationValue?.latlng} />
      </div>
    );
  }

  if (step === STEPS.INFO) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Share some basics about your place"
          subtitle="What amenities do you have?"
        />
        <Counter
          title="Tenants"
          subtitle="How many tenants are you looking for (max)?"
          value={guestCount}
          onChange={(value) => setCustomValue("guestCount", value)}
        />
        <hr />
        <Counter
          title="Bedrooms"
          subtitle="How many bedrooms do you have?"
          value={roomCount}
          onChange={(value) => setCustomValue("roomCount", value)}
        />
        <hr />
        <Counter
          title="Bathrooms"
          subtitle="How many bathrooms do you have?"
          value={bathroomCount}
          onChange={(value) => setCustomValue("bathroomCount", value)}
        />
        <hr />
      </div>
    );
  }

  //to not allow a null location
  useEffect(() => {
    if ((!imageSrc || imageSrc.length === 0) && step === STEPS.IMAGES) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [step, imageSrc]);

  if (step === STEPS.IMAGES) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Upload some photos of your place (max 30)"
          subtitle="You can always add more later (8 pictures you upload show in this preview, but all of them will be in your listing when posted!)"
        />
        <ImageUpload
          value={imageSrc}
          onChange={(value) => setCustomValue("imageSrc", value)}
        />
      </div>
    );
  }

  if (step === STEPS.DESCRIPTION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="How would you describe your place?"
          subtitle="Short and sweet works best!"
        />
        <hr />
        <Input
          id="title"
          label="Title"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <hr />
        <Input
          id="description"
          label="Description"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <hr />
        <div className="flex gap-8">
          <div className="flex-grow">
            <DatePick
              id="leaseStartDate"
              label="Lease start date"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              value={leaseStartDate}
              onChange={(value) => setCustomValue("leaseStartDate", value)}
            />
          </div>
          <div className="flex-grow">
            <DatePick
              id="leaseEndDate"
              label="Lease end date"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              value={leaseEndDate}
              onChange={(value) => setCustomValue("leaseEndDate", value)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.PRICE) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Set your price & activate your listing!"
          subtitle="Activate to indicate you are currently looking for tenants for your upcoming lease term. Deactivate later once you have found tenants!"
        />
        <Input
          id="price"
          label="Price per month"
          formatPrice
          type="number"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        
        <div className="flex items-center mt-4">
          <span className="mr-2">Activate your listing</span>
          <Switch
            checked={isActive}
            onChange={(checked) => setCustomValue("isActive", checked)}
            disabled={isLoading}
            offColor="#888"
            onColor="#862633"
            className="ml-3"
          />
        </div>
      </div>
    );
  }


  return (
    <Modal
      isOpen={rentModal.isOpen}
      onClose={rentModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      actionLabel={actionLabel}
      secondaryActionLabel={secondaryActionLabel}
      secondaryAction={step === STEPS.CATEGORY ? undefined : onBack}
      title="Post your space on EduRent"
      body={bodyContent}
      canAdvance={canAdvance}
      disabled={disabled}
    />
  );
};

export default RentModal;
